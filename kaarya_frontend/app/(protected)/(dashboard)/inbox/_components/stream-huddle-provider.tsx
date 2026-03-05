"use client";

import * as React from "react";
import {
  CallingState,
  hasScreenShare,
  ParticipantView,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCall,
  useCallStateHooks,
  type VideoPlaceholderProps,
  type Call,
} from "@stream-io/video-react-sdk";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Maximize2,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Minimize2,
  Radio,
  RadioTower,
  PhoneOff,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { getStreamVideoToken } from "@/lib/actions/inbox-actions";
import { buildHuddleCallId } from "./stream-huddle-utils";
import { toast } from "sonner";
import styles from "./stream-huddle-provider.module.css";

type HuddleMode = "audio" | "video";

type HuddlePresence = {
  active: boolean;
  participantCount: number;
  updatedAt: number;
};

type ActiveHuddleSession = {
  call: Call;
  callId: string;
  client: StreamVideoClient;
  mode: HuddleMode;
};

type StreamHuddleContextValue = {
  enabled: boolean;
  hasActiveHuddle: boolean;
  activeCallId: string | null;
  isHuddleMinimized: boolean;
  isBusy: boolean;
  startHuddle: (channelId: string, mode: HuddleMode) => Promise<void>;
  joinHuddle: (channelId: string) => Promise<void>;
  endHuddle: () => Promise<void>;
  minimizeHuddle: () => void;
  restoreHuddle: () => void;
  refreshHuddlePresence: (callId: string | null) => Promise<void>;
  getHuddlePresence: (callId: string | null) => HuddlePresence | undefined;
};

const StreamHuddleContext = React.createContext<StreamHuddleContextValue | null>(
  null,
);

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

function derivePresenceFromCall(call: Call): HuddlePresence {
  const participantCount =
    typeof call.state.participantCount === "number"
      ? call.state.participantCount
      : call.state.participants.length;
  const active = !call.state.endedAt && participantCount > 0;
  return {
    active,
    participantCount,
    updatedAt: Date.now(),
  };
}

function displayNameFromParticipant(participant: { name?: string | null; userId?: string | null }) {
  const name = participant.name?.trim();
  if (name) return name;
  const userId = participant.userId?.trim();
  return userId || "Participant";
}

function initialsFromDisplayName(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function HuddleVideoPlaceholder({ participant, className }: VideoPlaceholderProps) {
  const displayName = displayNameFromParticipant(participant);
  const initials = initialsFromDisplayName(displayName) || "U";

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_15%,rgba(56,189,248,0.2),rgba(15,23,42,0.98)_60%)]",
        className,
      )}
    >
      {participant.image ? (
        <div
          aria-label={displayName}
          className="h-[110px] w-[110px] rounded-full border border-white/20 bg-cover bg-center bg-no-repeat shadow-[0_14px_40px_rgba(2,6,23,0.35)]"
          style={{ backgroundImage: `url("${participant.image}")` }}
        />
      ) : (
        <div className="flex h-[110px] w-[110px] items-center justify-center rounded-full border border-white/20 bg-white/10 text-4xl font-semibold text-white shadow-[0_14px_40px_rgba(2,6,23,0.35)]">
          {initials}
        </div>
      )}
    </div>
  );
}

function HuddleViewport({
  mode,
  onClose,
  onMinimize,
}: {
  mode: HuddleMode;
  onClose: () => void;
  onMinimize: () => void;
}) {
  const call = useCall();
  const {
    useCallCallingState,
    useCameraState,
    useMicrophoneState,
    useParticipants,
    useScreenShareState,
    useHasOngoingScreenShare,
    useIsCallRecordingInProgress,
  } =
    useCallStateHooks();
  const participants = useParticipants();
  const callingState = useCallCallingState();
  const { microphone, optionsAwareIsMute: isMicMuted } = useMicrophoneState({
    optimisticUpdates: true,
  });
  const { camera, optionsAwareIsMute: isCameraMuted } = useCameraState({
    optimisticUpdates: true,
  });
  const {
    screenShare,
    optionsAwareIsMute: isScreenShareMuted,
    isTogglePending: isScreenSharePending,
  } = useScreenShareState({
    optimisticUpdates: true,
  });
  const isSomeoneScreenSharing = useHasOngoingScreenShare();
  const isRecording = useIsCallRecordingInProgress();
  const [isRecordingPending, setIsRecordingPending] = React.useState(false);

  React.useEffect(() => {
    if (callingState === CallingState.LEFT || callingState === CallingState.RECONNECTING_FAILED) {
      onClose();
    }
  }, [callingState, onClose]);

  const stageClassName =
    participants.length <= 1
      ? "mx-auto grid h-full w-full max-w-[1180px] grid-cols-1 gap-4"
      : participants.length === 2
        ? "mx-auto grid h-full w-full max-w-[1300px] grid-cols-1 gap-4 lg:grid-cols-2"
        : "mx-auto grid h-full w-full max-w-[1400px] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3";

  const screenSharingActive = isSomeoneScreenSharing || !isScreenShareMuted;
  const screenShareParticipant = participants.find((participant) =>
    hasScreenShare(participant),
  );

  const renderVideoTile = (
    participant: (typeof participants)[number],
    compact = false,
  ) => (
      <div
        key={participant.sessionId}
        className={cn(
          "relative h-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70",
          compact ? "min-h-[170px]" : "min-h-[240px]",
        )}
      >
        <ParticipantView
          participant={participant}
          className="h-full w-full"
          ParticipantViewUI={null}
          VideoPlaceholder={HuddleVideoPlaceholder}
        />
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md">
          {displayNameFromParticipant(participant)}
        </div>
      </div>
  );

  const renderAudioTile = (participant: (typeof participants)[number]) => (
      <div
        key={participant.sessionId}
        className="flex h-full min-h-[220px] items-center justify-center rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.22),rgba(15,23,42,0.92)_58%)]"
      >
        <div className="px-4 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10 text-3xl font-semibold text-white">
            {initialsFromDisplayName(displayNameFromParticipant(participant))}
          </div>
          <p className="mt-3 text-lg font-semibold text-slate-100">
            {displayNameFromParticipant(participant)}
          </p>
          <p className="mt-1 text-sm text-slate-300">Audio only</p>
        </div>
      </div>
  );

  return (
    <div className="relative flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#070d1c] text-white [font-family:var(--font-grotesk,Inter,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(56,189,248,0.12),transparent_40%),radial-gradient(circle_at_80%_100%,rgba(56,189,248,0.08),transparent_45%)]" />

      <div className="relative z-[1] flex items-center justify-between border-b border-white/10 bg-[#070d1c]/90 px-5 py-3 backdrop-blur-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <p className="text-sm font-semibold">Huddle in progress</p>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-200">
            <Users className="h-3.5 w-3.5" />
            {participants.length}
          </span>
          {screenSharingActive ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-300/30 bg-sky-400/15 px-2 py-0.5 text-xs font-semibold text-sky-100">
              <Monitor className="h-3.5 w-3.5" />
              Sharing
            </span>
          ) : null}
          {isRecording ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-300/35 bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-100">
              <Radio className="h-3.5 w-3.5" />
              Recording
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-slate-200 hover:bg-white/10 hover:text-white"
            onClick={onMinimize}
            aria-label="Minimize huddle"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-slate-200 hover:bg-white/10 hover:text-white"
            onClick={onMinimize}
            aria-label="Close huddle view"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative z-[1] flex-1 overflow-hidden p-4 lg:p-5">
        {participants.length === 0 ? (
          <div className="mx-auto flex h-full w-full max-w-[920px] items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <p className="text-sm text-slate-200">Waiting for participants to join...</p>
          </div>
        ) : screenShareParticipant ? (
          <div className="mx-auto grid h-full w-full max-w-[1440px] grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
            <div className="relative h-full min-h-[280px] overflow-hidden rounded-2xl border border-sky-300/30 bg-slate-900/70">
              <ParticipantView
                participant={screenShareParticipant}
                trackType="screenShareTrack"
                className="h-full w-full"
                ParticipantViewUI={null}
                VideoPlaceholder={HuddleVideoPlaceholder}
              />
              <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-sky-300/35 bg-sky-500/20 px-3 py-1.5 text-xs font-semibold text-sky-100 backdrop-blur-md">
                <Monitor className="h-3.5 w-3.5" />
                {displayNameFromParticipant(screenShareParticipant)} is sharing
              </div>
            </div>

            <div className="grid auto-rows-[minmax(170px,1fr)] gap-4 overflow-y-auto pr-1">
              {participants.map((participant) => renderVideoTile(participant, true))}
            </div>
          </div>
        ) : (
          <div className={stageClassName}>
            {participants.map((participant) =>
              mode === "audio" ? renderAudioTile(participant) : renderVideoTile(participant),
            )}
          </div>
        )}
      </div>

      <div className="relative z-[1] border-t border-white/10 bg-[#070d1c]/88 px-5 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className={cn(
              "h-11 w-11 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20",
              isMicMuted ? "border-rose-300/35 bg-rose-500/20 text-rose-100 hover:bg-rose-500/30" : "",
            )}
            onClick={() => {
              void microphone.toggle();
            }}
            aria-label={isMicMuted ? "Unmute microphone" : "Mute microphone"}
          >
            {isMicMuted ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
          </Button>
          {mode === "video" ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className={cn(
                "h-11 w-11 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20",
                isCameraMuted ? "border-rose-300/35 bg-rose-500/20 text-rose-100 hover:bg-rose-500/30" : "",
              )}
              onClick={() => {
                void camera.toggle();
              }}
              aria-label={isCameraMuted ? "Turn camera on" : "Turn camera off"}
            >
              {isCameraMuted ? (
                <VideoOff className="h-4.5 w-4.5" />
              ) : (
                <Video className="h-4.5 w-4.5" />
              )}
            </Button>
          ) : null}
          <Button
            type="button"
            size="icon"
            variant="outline"
            className={cn(
              "h-11 w-11 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20",
              screenSharingActive
                ? "border-sky-300/35 bg-sky-500/20 text-sky-100 hover:bg-sky-500/30"
                : "",
            )}
            onClick={() => {
              void screenShare.toggle().catch((error: unknown) => {
                toast.error(toErrorMessage(error, "Unable to toggle screen share."));
              });
            }}
            aria-label={isScreenShareMuted ? "Start screen share" : "Stop screen share"}
            disabled={isScreenSharePending}
          >
            {isScreenSharePending ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : isScreenShareMuted ? (
              <MonitorOff className="h-4.5 w-4.5" />
            ) : (
              <Monitor className="h-4.5 w-4.5" />
            )}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className={cn(
              "h-11 w-11 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20",
              isRecording ? "border-rose-300/35 bg-rose-500/20 text-rose-100 hover:bg-rose-500/30" : "",
            )}
            onClick={() => {
              if (!call || isRecordingPending) return;
              setIsRecordingPending(true);
              const action = isRecording ? call.stopRecording() : call.startRecording();
              void action
                .catch((error: unknown) => {
                  toast.error(toErrorMessage(error, "Unable to toggle recording."));
                })
                .finally(() => {
                  setIsRecordingPending(false);
                });
            }}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
            disabled={isRecordingPending || !call}
          >
            {isRecordingPending ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : isRecording ? (
              <RadioTower className="h-4.5 w-4.5" />
            ) : (
              <Radio className="h-4.5 w-4.5" />
            )}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-11 w-11 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20"
            onClick={onMinimize}
            aria-label="Minimize huddle"
          >
            <Minimize2 className="h-4.5 w-4.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            className="h-11 w-11 rounded-full bg-rose-500 text-white hover:bg-rose-600"
            onClick={onClose}
            aria-label="Leave huddle"
          >
            <PhoneOff className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

type StreamHuddleProviderProps = {
  apiKey: string;
  enabled: boolean;
  userId: string;
  userName: string;
  children: React.ReactNode;
};

export function StreamHuddleProvider({
  apiKey,
  enabled,
  userId,
  userName,
  children,
}: StreamHuddleProviderProps) {
  const [activeSession, setActiveSession] = React.useState<ActiveHuddleSession | null>(null);
  const [isHuddleMinimized, setIsHuddleMinimized] = React.useState(false);
  const [isBusy, setIsBusy] = React.useState(false);
  const [presenceByCallId, setPresenceByCallId] = React.useState<
    Record<string, HuddlePresence>
  >({});

  const clientRef = React.useRef<StreamVideoClient | null>(null);
  const clientBootPromiseRef = React.useRef<Promise<StreamVideoClient> | null>(null);
  const activeSessionRef = React.useRef<ActiveHuddleSession | null>(null);
  const activeCallListenersRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  const tokenProvider = React.useCallback(async () => {
    const tokenRes = await getStreamVideoToken();
    if (!tokenRes?.success || !tokenRes.data?.token) {
      throw new Error(tokenRes?.message ?? "Failed to get video token");
    }
    return tokenRes.data.token;
  }, []);

  const ensureVideoClient = React.useCallback(async () => {
    if (clientRef.current) {
      return clientRef.current;
    }
    if (clientBootPromiseRef.current) {
      return clientBootPromiseRef.current;
    }

    const setupPromise = (async () => {
      const tokenRes = await getStreamVideoToken();
      if (!tokenRes?.success || !tokenRes.data?.token) {
        throw new Error(tokenRes?.message ?? "Failed to get video token");
      }

      const resolvedApiKey = tokenRes.data.apiKey?.trim() || apiKey.trim();
      if (!resolvedApiKey) {
        throw new Error("Stream Video API key is missing");
      }

      const client = new StreamVideoClient({
        apiKey: resolvedApiKey,
        user: {
          id: userId,
          name: userName,
        },
        token: tokenRes.data.token,
        tokenProvider,
      });

      clientRef.current = client;
      return client;
    })();

    clientBootPromiseRef.current = setupPromise;

    try {
      return await setupPromise;
    } finally {
      clientBootPromiseRef.current = null;
    }
  }, [apiKey, tokenProvider, userId, userName]);

  const upsertPresence = React.useCallback((callId: string, presence: HuddlePresence) => {
    setPresenceByCallId((current) => ({ ...current, [callId]: presence }));
  }, []);

  const refreshHuddlePresence = React.useCallback(
    async (callId: string | null) => {
      if (!enabled || !callId) return;

      try {
        const client = await ensureVideoClient();
        const result = await client.queryCalls({
          filter_conditions: {
            type: "default",
            id: callId,
          },
          limit: 1,
          watch: false,
        });
        const call = result.calls[0];

        if (!call) {
          upsertPresence(callId, {
            active: false,
            participantCount: 0,
            updatedAt: Date.now(),
          });
          return;
        }

        upsertPresence(callId, derivePresenceFromCall(call));
      } catch {
        // Ignore transient presence errors to avoid noisy UX while polling.
      }
    },
    [enabled, ensureVideoClient, upsertPresence],
  );

  const detachActiveCallListeners = React.useCallback(() => {
    activeCallListenersRef.current?.();
    activeCallListenersRef.current = null;
  }, []);

  const endHuddle = React.useCallback(async () => {
    const current = activeSessionRef.current;
    detachActiveCallListeners();

    if (current) {
      await current.call.microphone.disable().catch(() => {});
      await current.call.camera.disable().catch(() => {});
      await current.call.screenShare.disable().catch(() => {});
      await current.call.leave({ reject: false }).catch(() => {});
      upsertPresence(current.callId, {
        active: false,
        participantCount: 0,
        updatedAt: Date.now(),
      });
    }

    setActiveSession(null);
    setIsHuddleMinimized(false);
  }, [detachActiveCallListeners, upsertPresence]);

  const attachActiveCallListeners = React.useCallback(
    (call: Call, callId: string) => {
      detachActiveCallListeners();

      const update = () => {
        upsertPresence(callId, derivePresenceFromCall(call));
      };
      const handleEnded = () => {
        void endHuddle();
      };

      const unsubscribers = [
        call.on("call.session_participant_joined", update),
        call.on("call.session_participant_left", update),
        call.on("call.session_participant_count_updated", update),
        call.on("call.updated", update),
        call.on("call.ended", handleEnded),
        call.on("call.session_ended", handleEnded),
      ];

      activeCallListenersRef.current = () => {
        unsubscribers.forEach((unsubscribe) => {
          try {
            unsubscribe();
          } catch {
            // Ignore cleanup failures.
          }
        });
      };
    },
    [detachActiveCallListeners, endHuddle, upsertPresence],
  );

  React.useEffect(() => {
    if (!activeSession) return;
    const timer = window.setInterval(() => {
      upsertPresence(activeSession.callId, derivePresenceFromCall(activeSession.call));
    }, 3500);
    return () => {
      window.clearInterval(timer);
    };
  }, [activeSession, upsertPresence]);

  React.useEffect(() => {
    return () => {
      detachActiveCallListeners();
      const current = activeSessionRef.current;
      if (current) {
        void current.call.microphone.disable().catch(() => {});
        void current.call.camera.disable().catch(() => {});
        void current.call.screenShare.disable().catch(() => {});
        void current.call.leave({ reject: false }).catch(() => {});
      }
      if (clientRef.current) {
        void clientRef.current.disconnectUser().catch(() => {});
        clientRef.current = null;
      }
    };
  }, [detachActiveCallListeners]);

  const startHuddle = React.useCallback(
    async (channelId: string, mode: HuddleMode) => {
      if (!enabled) {
        toast.error("Video calls are currently unavailable.");
        return;
      }

      const callId = buildHuddleCallId(channelId);
      if (!callId) {
        toast.error("Unable to start a huddle from this conversation.");
        return;
      }

      setIsBusy(true);
      try {
        const client = await ensureVideoClient();
        const current = activeSessionRef.current;

        if (current?.callId === callId) {
          if (mode === "audio") {
            await current.call.camera.disable().catch(() => {});
          } else {
            await current.call.camera.enable().catch(() => {});
          }
          setActiveSession((value) => (value ? { ...value, mode } : value));
          setIsHuddleMinimized(false);
          upsertPresence(callId, derivePresenceFromCall(current.call));
          return;
        }

        if (current) {
          await endHuddle();
        }

        const call = client.call("default", callId, { reuseInstance: true });
        await call.join({ create: true });

        if (mode === "audio") {
          await call.camera.disable().catch(() => {});
        } else {
          await call.camera.enable().catch(() => {});
        }

        attachActiveCallListeners(call, callId);
        upsertPresence(callId, derivePresenceFromCall(call));
        setActiveSession({ call, callId, client, mode });
        setIsHuddleMinimized(false);
      } catch (error) {
        toast.error(toErrorMessage(error, "Unable to start huddle right now."));
      } finally {
        setIsBusy(false);
      }
    },
    [attachActiveCallListeners, enabled, endHuddle, ensureVideoClient, upsertPresence],
  );

  const joinHuddle = React.useCallback(
    async (channelId: string) => {
      await startHuddle(channelId, "video");
    },
    [startHuddle],
  );

  const contextValue = React.useMemo<StreamHuddleContextValue>(
    () => ({
      enabled,
      hasActiveHuddle: Boolean(activeSession),
      activeCallId: activeSession?.callId ?? null,
      isHuddleMinimized,
      isBusy,
      startHuddle,
      joinHuddle,
      endHuddle,
      minimizeHuddle: () => setIsHuddleMinimized(true),
      restoreHuddle: () => setIsHuddleMinimized(false),
      refreshHuddlePresence,
      getHuddlePresence: (callId) => {
        if (!callId) return undefined;
        const presence = presenceByCallId[callId];
        if (!presence) return undefined;

        // Guard against stale presence if polling temporarily fails.
        if (presence.active && Date.now() - presence.updatedAt > 15_000) {
          return {
            active: false,
            participantCount: 0,
            updatedAt: presence.updatedAt,
          };
        }

        return presence;
      },
    }),
    [
      activeSession,
      enabled,
      endHuddle,
      isBusy,
      isHuddleMinimized,
      joinHuddle,
      presenceByCallId,
      refreshHuddlePresence,
      startHuddle,
    ],
  );

  return (
    <StreamHuddleContext.Provider value={contextValue}>
      {children}

      {activeSession ? (
        <>
          <div
            className={
              isHuddleMinimized
                ? "pointer-events-none fixed inset-0 z-[90] opacity-0"
                : "fixed inset-0 z-[90]"
            }
          >
            <div className={styles.huddleShell}>
              <StreamVideo client={activeSession.client}>
                <StreamCall call={activeSession.call}>
                  <StreamTheme className={cn("h-full w-full", styles.huddleTheme)}>
                    <HuddleViewport
                      mode={activeSession.mode}
                      onClose={() => {
                        void endHuddle();
                      }}
                      onMinimize={() => setIsHuddleMinimized(true)}
                    />
                  </StreamTheme>
                </StreamCall>
              </StreamVideo>
            </div>
          </div>

          {isHuddleMinimized ? (
            <div className="fixed bottom-4 right-4 z-[91] w-[320px] rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-[0_16px_36px_rgba(15,23,42,0.18)]">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Huddle running</p>
                  <p className="text-xs text-slate-500">
                    {presenceByCallId[activeSession.callId]?.participantCount ?? 1} participants
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100"
                    onClick={() => setIsHuddleMinimized(false)}
                    aria-label="Open huddle"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-rose-500 text-white hover:bg-rose-600"
                    onClick={() => {
                      void endHuddle();
                    }}
                    aria-label="Leave huddle"
                  >
                    <PhoneOff className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {isBusy ? (
        <div className="fixed right-4 top-4 z-[92] inline-flex items-center gap-2 rounded-lg border border-[#e5ebf4] bg-white px-3 py-2 text-xs text-slate-600 shadow-md">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Connecting huddle...
        </div>
      ) : null}
    </StreamHuddleContext.Provider>
  );
}

export function useStreamHuddle() {
  const context = React.useContext(StreamHuddleContext);
  if (!context) {
    throw new Error("useStreamHuddle must be used within StreamHuddleProvider");
  }
  return context;
}
