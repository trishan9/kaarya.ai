import { Card } from "@/components/ui/card";

type LeaderboardGuideCardProps = {
  xpPerLevel: number;
};

export const LeaderboardGuideCard = ({
  xpPerLevel,
}: LeaderboardGuideCardProps) => {
  return (
    <Card className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900">How Ranking Works</p>
        <p className="text-xs text-slate-600">
          Transparent scoring model. Keep XP growth consistent and improve interview quality.
        </p>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <p className="font-semibold text-slate-900">K-Rank Formula</p>
          <p className="mt-1">K-Rank = (XP x quality factor) + (Score x 2)</p>
          <p className="mt-1">
            If K-Rank ties, higher Score ranks above. Lower Score also reduces effective XP using
            quality factors below.
          </p>

          <div className="mt-2 overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700">
              <span>Score Range</span>
              <span>XP Counted</span>
            </div>
            <div className="grid grid-cols-2 px-2 py-1 text-[11px]">
              <span>80+</span>
              <span>100%</span>
            </div>
            <div className="grid grid-cols-2 border-t border-slate-100 px-2 py-1 text-[11px]">
              <span>60-79</span>
              <span>90%</span>
            </div>
            <div className="grid grid-cols-2 border-t border-slate-100 px-2 py-1 text-[11px]">
              <span>40-59</span>
              <span>75%</span>
            </div>
            <div className="grid grid-cols-2 border-t border-slate-100 px-2 py-1 text-[11px]">
              <span>20-39</span>
              <span>55%</span>
            </div>
            <div className="grid grid-cols-2 border-t border-slate-100 px-2 py-1 text-[11px]">
              <span>1-19</span>
              <span>35%</span>
            </div>
            <div className="grid grid-cols-2 border-t border-slate-100 px-2 py-1 text-[11px]">
              <span>0 or less</span>
              <span>20%</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <p className="font-semibold text-slate-900">Progress Guide</p>
          <ul className="mt-1 space-y-1.5">
            <li>Increase XP with profile updates, saves, applications, and completed activities.</li>
            <li>Increase Score with better mock interview outcomes and consistency.</li>
            <li>Level is XP-only: Level = floor(XP / {xpPerLevel}) + 1.</li>
            <li>Every {xpPerLevel} XP increases level by 1.</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
