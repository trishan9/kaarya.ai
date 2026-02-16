import { Card } from "@/components/ui/card";

type LeaderboardGuideCardProps = {
  xpPerLevel: number;
};

export const LeaderboardGuideCard = ({
  xpPerLevel,
}: LeaderboardGuideCardProps) => {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <p className="text-sm font-semibold text-slate-900">How to move up</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-sm font-semibold text-slate-900">Gain XP</p>
          <div className="space-y-1.5 text-xs text-slate-700">
            <p>Keep your profile updated.</p>
            <p>Save jobs and mock interviews you like.</p>
            <p>Apply for jobs and keep applying consistently.</p>
            <p>Finish mock interviews and run resume checks.</p>
            <p>Build and save more resumes in the builder.</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-sm font-semibold text-slate-900">
            Grow Score
          </p>
          <div className="space-y-1.5 text-xs text-slate-700">
            <p>Do well in mock interviews.</p>
            <p>Keep a strong average over many mock interviews.</p>
            <p>Get shortlisted, invited, and accepted more often.</p>
            <p>Low interview results or rejections can lower Score.</p>
            <p>Consistency beats one lucky high result.</p>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
        <p className="font-semibold text-slate-900">How rank is calculated</p>
        <p className="mt-1">
          K-Rank points = (XP x quality factor) + (Score x 2).
        </p>
        <p className="mt-1">
          Quality factor depends on Score. If Score is very low, only part of XP
          counts. If two people tie on K-Rank, higher Score ranks above.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
            <p className="text-[11px] font-semibold text-slate-900">
              Score 80+
            </p>
            <p className="text-[11px] text-slate-600">XP counts 100%</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
            <p className="text-[11px] font-semibold text-slate-900">
              Score 60-79
            </p>
            <p className="text-[11px] text-slate-600">XP counts 90%</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
            <p className="text-[11px] font-semibold text-slate-900">
              Score 40-59
            </p>
            <p className="text-[11px] text-slate-600">XP counts 75%</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
            <p className="text-[11px] font-semibold text-slate-900">
              Score 20-39
            </p>
            <p className="text-[11px] text-slate-600">XP counts 55%</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
            <p className="text-[11px] font-semibold text-slate-900">
              Score 1-19
            </p>
            <p className="text-[11px] text-slate-600">XP counts 35%</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
            <p className="text-[11px] font-semibold text-slate-900">
              Score 0 or less
            </p>
            <p className="text-[11px] text-slate-600">XP counts 20%</p>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
        <p className="font-semibold text-slate-900">How levels work</p>
        <p className="mt-1">
          Level is based only on XP. Current rule:{" "}
          <span className="font-semibold">
            Level = floor(XP / {xpPerLevel}) + 1
          </span>
          .
        </p>
        <p className="mt-1">
          Every {xpPerLevel} XP gives +1 level. Example: XP 0-249 = Level 1, XP
          250-499 = Level 2, XP 500-749 = Level 3.
        </p>
      </div>
    </Card>
  );
};
