"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Vapi from "@vapi-ai/web";
import {
  AlertCircle,
  Clock3,
  Loader2,
  MessageSquareText,
  Mic,
  PhoneOff,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import aiInterviewerImage from "@/assets/ai_interviewer.webp";

type TranscriptMessage = {
  role: "assistant" | "user" | "system";
  content: string;
  timestamp: string;
};

const normalizeForMatch = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toErrorMessage = (value: unknown, fallback: string) => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message || fallback;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (record.message) return toErrorMessage(record.message, fallback);
    if (typeof record.error === "string") return record.error;
    if (record.error) return toErrorMessage(record.error, fallback);
    try {
      return JSON.stringify(record);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const formatElapsed = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
};

type InterviewCallPanelProps = {
  interviewId: string;
  interviewTitle: string;
  interviewerLabel: string;
  candidateName?: string;
  candidatePhoto?: string | null;
  questionBank?: string[];
  returnTo?: string | null;
};

const resolveReturnTo = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }
  return trimmed;
};

const withReturnTo = (path: string, returnTo?: string | null) => {
  const safeReturnTo = resolveReturnTo(returnTo);
  if (!safeReturnTo) return path;
  return `${path}${path.includes("?") ? "&" : "?"}returnTo=${encodeURIComponent(safeReturnTo)}`;
};

export function InterviewCallPanel({
  interviewId,
  interviewTitle,
  interviewerLabel,
  candidateName = "Candidate",
  candidatePhoto,
  questionBank = [],
  returnTo = null,
}: InterviewCallPanelProps) {
  const router = useRouter();
  const vapiRef = useRef<Vapi | null>(null);
  const finalizeInProgressRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const transcriptRef = useRef<TranscriptMessage[]>([]);
  const vapiCallIdRef = useRef<string | null>(null);
  const transcriptBottomRef = useRef<HTMLDivElement | null>(null);
  const speakerResetTimerRef = useRef<number | null>(null);
  const autoEndRequestedRef = useRef(false);
  const askedQuestionIndexesRef = useRef<Set<number>>(new Set());
  const normalizedQuestionBankRef = useRef<string[]>([]);

  const [status, setStatus] = useState<
    "idle" | "connecting" | "active" | "finishing"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<"assistant" | "user" | null>(
    null,
  );
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [askedQuestionCount, setAskedQuestionCount] = useState(0);
  const [sessionQuestionBank, setSessionQuestionBank] =
    useState<string[]>(questionBank);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    normalizedQuestionBankRef.current = questionBank
      .map((question) => normalizeForMatch(question))
      .filter(Boolean);
    setSessionQuestionBank(questionBank);
  }, [questionBank]);

  useEffect(() => {
    normalizedQuestionBankRef.current = sessionQuestionBank
      .map((question) => normalizeForMatch(question))
      .filter(Boolean);
  }, [sessionQuestionBank]);

  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [transcript]);

  useEffect(() => {
    if (status !== "active") {
      if (status === "idle") {
        setElapsedSeconds(0);
      }
      return;
    }

    const intervalId = window.setInterval(() => {
      if (!startedAtRef.current) return;
      setElapsedSeconds(Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000)));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [status]);

  const registerVapiListeners = (vapi: Vapi) => {
    const onCallStart = (call?: { id?: string }) => {
      if (typeof call?.id === "string" && call.id.trim()) {
        vapiCallIdRef.current = call.id;
      }
      setStatus("active");
      setError(null);
      startedAtRef.current = Date.now();
      setElapsedSeconds(0);
    };

    const onCallEnd = () => {
      setStatus("finishing");
      window.setTimeout(() => {
        void finalizeSession();
      }, 250);
    };

    const onMessage = (message: any) => {
      if (message?.type !== "transcript" || message?.transcriptType !== "final") {
        return;
      }

      const role =
        message?.role === "assistant" || message?.role === "system"
          ? message.role
          : "user";
      const content =
        typeof message?.transcript === "string" ? message.transcript.trim() : "";
      if (!content) return;

      setTranscript((previous) => {
        const next = [
          ...previous,
          {
            role,
            content,
            timestamp: new Date().toISOString(),
          },
        ];
        transcriptRef.current = next;
        return next;
      });

      if (role === "user") {
        setActiveSpeaker("user");
        if (speakerResetTimerRef.current) {
          window.clearTimeout(speakerResetTimerRef.current);
        }
        speakerResetTimerRef.current = window.setTimeout(() => {
          setActiveSpeaker((current) => (current === "user" ? null : current));
        }, 1400);
      }

      if (
        role === "assistant" &&
        !autoEndRequestedRef.current &&
        normalizedQuestionBankRef.current.length > 0
      ) {
        const normalizedContent = normalizeForMatch(content);
        normalizedQuestionBankRef.current.forEach((question, questionIndex) => {
          if (!question) return;
          if (
            normalizedContent.includes(question) &&
            !askedQuestionIndexesRef.current.has(questionIndex)
          ) {
            askedQuestionIndexesRef.current.add(questionIndex);
          }
        });
        setAskedQuestionCount(askedQuestionIndexesRef.current.size);
      }

      if (role === "assistant" && !autoEndRequestedRef.current) {
        const isExplicitClosing =
          /this concludes|that concludes|interview (is )?(now )?complete|thank you for your time/i.test(
            content,
          );
        const askedAllQuestions =
          normalizedQuestionBankRef.current.length > 0 &&
          askedQuestionIndexesRef.current.size >=
            normalizedQuestionBankRef.current.length;

        if (!isExplicitClosing && !askedAllQuestions) {
          return;
        }

        autoEndRequestedRef.current = true;
        setStatus("finishing");
        window.setTimeout(() => {
          void vapi.stop();
        }, 650);
      }
    };

    const onSpeechStart = () => {
      setIsSpeaking(true);
      setActiveSpeaker("assistant");
    };

    const onSpeechEnd = () => {
      setIsSpeaking(false);
      setActiveSpeaker((current) => (current === "assistant" ? null : current));
    };

    const onError = (event: { error?: unknown }) => {
      setError(toErrorMessage(event?.error, "Interview call failed."));
      setStatus("idle");
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);
  };

  const startCall = async () => {
    setError(null);
    setStatus("connecting");
    setTranscript([]);
    transcriptRef.current = [];
    vapiCallIdRef.current = null;
    autoEndRequestedRef.current = false;
    askedQuestionIndexesRef.current = new Set();
    setAskedQuestionCount(0);
    setSessionQuestionBank(questionBank);
    sessionIdRef.current = null;
    startedAtRef.current = null;
    finalizeInProgressRef.current = false;
    setActiveSpeaker(null);
    setIsSpeaking(false);
    setElapsedSeconds(0);

    try {
      const response = await fetch(`/api/interviews/${interviewId}/sessions/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "web",
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        setStatus("idle");
        setError(
          toErrorMessage(
            payload?.message ?? payload?.error ?? payload,
            "Unable to start interview session.",
          ),
        );
        return;
      }

      const sessionId = payload?.data?.session?.id as string | undefined;
      const sessionQuestionOrder = Array.isArray(
        payload?.data?.session?.metadata?.questionOrder,
      )
        ? (payload.data.session.metadata.questionOrder as unknown[])
            .map((question) =>
              typeof question === "string" ? question.trim() : "",
            )
            .filter(Boolean)
        : [];
      const webToken = payload?.data?.vapi?.webToken as string | undefined;
      const workflowId = payload?.data?.vapi?.workflowId as string | undefined;
      const assistant = payload?.data?.vapi?.assistant;
      const variableValues = payload?.data?.vapi?.variableValues ?? {};

      if (!sessionId) {
        setStatus("idle");
        setError("Session id is missing.");
        return;
      }

      if (!webToken) {
        setStatus("idle");
        setError("VAPI web token is missing in backend configuration.");
        return;
      }

      sessionIdRef.current = sessionId;
      if (sessionQuestionOrder.length > 0) {
        setSessionQuestionBank(sessionQuestionOrder);
      }
      const vapi = new Vapi(webToken);
      vapiRef.current = vapi;
      registerVapiListeners(vapi);

      if (assistant) {
        await vapi.start(assistant, {
          variableValues,
        });
        return;
      }

      if (workflowId) {
        await vapi.start(undefined, undefined, undefined, workflowId, {
          variableValues,
        });
        return;
      }

      setStatus("idle");
      setError("No VAPI assistant or workflow config found.");
    } catch (caughtError) {
      setStatus("idle");
      setError(toErrorMessage(caughtError, "Unable to start interview call."));
    }
  };

  const finalizeSession = async () => {
    if (finalizeInProgressRef.current) return;
    const sessionId = sessionIdRef.current;
    if (!sessionId) {
      setStatus("idle");
      return;
    }

    finalizeInProgressRef.current = true;
    try {
      const durationSeconds = startedAtRef.current
        ? Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000))
        : undefined;
      const response = await fetch(
        `/api/interviews/${interviewId}/sessions/${sessionId}/complete`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "completed",
            transcript: transcriptRef.current,
            vapiCallId: vapiCallIdRef.current ?? undefined,
            durationSeconds,
            generateEvaluation: true,
          }),
        },
      );
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        setError(
          toErrorMessage(
            payload?.message ?? payload?.error ?? payload,
            "Session finished but feedback failed.",
          ),
        );
        setStatus("idle");
        return;
      }

      router.push(
        withReturnTo(`/interviews/sessions/${sessionId}/feedback`, returnTo),
      );
      router.refresh();
    } catch (caughtError) {
      setError(
        toErrorMessage(
          caughtError,
          "Interview ended, but feedback generation failed.",
        ),
      );
      setStatus("idle");
    } finally {
      finalizeInProgressRef.current = false;
    }
  };

  const endCall = () => {
    if (!vapiRef.current) return;
    setStatus("finishing");
    vapiRef.current.stop();
  };

  useEffect(() => {
    return () => {
      if (speakerResetTimerRef.current) {
        window.clearTimeout(speakerResetTimerRef.current);
      }
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, []);

  const latestTranscript = useMemo(
    () => transcript[transcript.length - 1] ?? null,
    [transcript],
  );

  const hasCandidatePhoto =
    typeof candidatePhoto === "string" && candidatePhoto.trim().length > 0;
  const candidateInitials = candidateName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

  return (
    <section className="space-y-4 rounded-2xl border border-[#ececf0] bg-white p-3 shadow-sm sm:space-y-5 sm:p-4 lg:p-6">
      <div className="flex flex-col gap-2 rounded-xl border border-[#e7eef7] bg-[#f7fbff] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-sm font-semibold text-[#0d6fae] sm:text-base">
            {interviewTitle}
          </span>
          <Badge className="border-0 bg-[#0d6fae]/10 text-[#0d6fae] hover:bg-[#0d6fae]/10">
            AI-Powered Mock Interview
          </Badge>
          <Badge className="border-0 bg-[#0d6fae]/10 text-[#0d6fae] hover:bg-[#0d6fae]/10">
            {sessionQuestionBank.length > 0
              ? `${askedQuestionCount}/${sessionQuestionBank.length} Questions`
              : "Interview Ready"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1 rounded-md border border-[#d8e4f1] bg-white px-2 py-1 text-xs font-medium text-slate-700">
            <Clock3 className="h-3.5 w-3.5" />
            {formatElapsed(elapsedSeconds)}
          </span>
          <Badge
            className={cn(
              "rounded-md border-0 text-white",
              status === "active"
                ? "bg-emerald-500"
                : status === "connecting"
                  ? "bg-amber-500"
                  : status === "finishing"
                    ? "bg-rose-500"
                    : "bg-slate-400",
            )}
          >
            {status === "active"
              ? "In Call"
              : status === "connecting"
                ? "Connecting"
                : status === "finishing"
                  ? "Finishing"
                  : "Ready"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border bg-[#0c6daf]",
            activeSpeaker === "assistant"
              ? "border-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]"
              : "border-[#d9e5f2]",
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
          <div className="relative aspect-[4/3] sm:aspect-[16/11]">
            <Image
              src={aiInterviewerImage}
              alt="AI Interviewer"
              fill
              className="origin-bottom scale-[0.92] object-contain object-bottom px-4 pb-0 pt-2 sm:px-8 sm:pt-3"
              sizes="(max-width: 767px) 100vw, 50vw"
            />
          </div>

          <div className="absolute left-2 top-2 rounded-md bg-black/35 px-2 py-1 text-xs font-medium text-white">
            AI Interviewer
          </div>

          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
            <div>
              <p className="line-clamp-1 text-sm font-semibold leading-tight text-white">
                {interviewerLabel}
              </p>
              <p className="text-xs text-white/90">
                {isSpeaking ? "Speaking..." : "Listening..."}
              </p>
            </div>
            <div className="rounded-full bg-white/30 p-2 text-white backdrop-blur-sm">
              <Volume2 className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border bg-[#f3f5f7]",
            activeSpeaker === "user"
              ? "border-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]"
              : "border-[#e5e7eb]",
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
          <div className="relative aspect-[4/3] overflow-hidden bg-[#dbe6f2] sm:aspect-[16/11]">
            {hasCandidatePhoto ? (
              <div
                className="absolute inset-0 scale-110 bg-cover bg-center opacity-25 blur-2xl"
                style={{ backgroundImage: `url(${candidatePhoto})` }}
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-br from-[#dce8f4] via-[#d2e1ef] to-[#c8d9ea]" />

            <div className="absolute inset-0 flex items-center justify-center px-4">
              <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white/80 bg-white/30 shadow-[0_12px_30px_rgba(15,23,42,0.2)] sm:h-32 sm:w-32 lg:h-36 lg:w-36">
                {hasCandidatePhoto ? (
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${candidatePhoto})` }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#9eb9d3] text-3xl font-semibold text-white">
                    {candidateInitials}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="absolute left-2 top-2 rounded-md bg-black/35 px-2 py-1 text-xs font-medium text-white">
            {candidateName}
          </div>

          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
            <div>
              <p className="line-clamp-1 text-sm font-semibold leading-tight text-white">
                {candidateName}
              </p>
              <p className="text-xs text-white/90">
                {activeSpeaker === "user" ? "Speaking..." : "Listening..."}
              </p>
            </div>
            <div className="rounded-full bg-white/30 p-2 text-white backdrop-blur-sm">
              <Mic className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {status === "idle" ? (
          <Button
            onClick={startCall}
            className="h-11 w-full rounded-xl bg-[#0d6fae] text-sm hover:bg-[#0a5a8e] sm:h-12 sm:text-base"
          >
            <Mic className="h-4 w-4" />
            Start Interview
          </Button>
        ) : status === "connecting" || status === "finishing" ? (
          <Button disabled className="h-11 w-full rounded-xl text-sm sm:h-12 sm:text-base">
            <Loader2 className="h-4 w-4 animate-spin" />
            {status === "connecting" ? "Connecting..." : "Finishing..."}
          </Button>
        ) : (
          <Button
            variant="destructive"
            onClick={endCall}
            className="h-11 w-full rounded-xl bg-[#e50914] text-sm hover:bg-[#c90812] sm:h-12 sm:text-base"
          >
            <PhoneOff className="h-4 w-4" />
            End Interview
          </Button>
        )}
        <p className="text-center text-xs text-muted-foreground">
          {status === "active"
            ? "Interview is live. Your transcript and evaluation are being recorded."
            : "Use a quiet environment and clear audio for better AI evaluation."}
        </p>
      </div>

      <div className="rounded-2xl border border-[#ececf0] bg-[#f4f5f7] p-3 sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Live Transcript</p>
          </div>
          <span className="rounded bg-white px-2 py-0.5 text-xs text-muted-foreground">
            Real-time
          </span>
        </div>

        {latestTranscript ? (
          <div className="mb-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-foreground">
            {latestTranscript.content}
          </div>
        ) : null}

        <div className="max-h-[40vh] space-y-2 overflow-y-auto rounded-xl border border-[#e5e7eb] bg-white p-3 sm:max-h-64">
          {transcript.length > 0 ? (
            transcript.map((message, index) => (
              <div
                key={`${message.timestamp}-${index}`}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm",
                  message.role === "assistant"
                    ? "border-[#d7ecff] bg-[#edf7ff]"
                    : message.role === "user"
                      ? "border-[#e6e9ef] bg-[#f8f9fb]"
                      : "border-amber-200 bg-amber-50",
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-[11px] uppercase tracking-wide">
                  <span className="font-semibold text-slate-700">
                    {message.role === "assistant"
                      ? "AI"
                      : message.role === "user"
                        ? "You"
                        : "System"}
                  </span>
                  <span className="text-slate-500">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-slate-700">{message.content}</p>
              </div>
            ))
          ) : (
            <p className="text-sm italic text-muted-foreground">
              Transcript will appear here in real time after the call starts.
            </p>
          )}
          <div ref={transcriptBottomRef} />
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
    </section>
  );
}
