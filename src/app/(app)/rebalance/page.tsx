export default function RebalancePage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <span className="text-5xl">🔄</span>
      <h2 className="text-xl font-semibold">리밸런싱 계산기</h2>
      <p className="text-foreground/60 text-sm text-center max-w-sm">
        M3–M4에서 구현 예정입니다. 목표 비중 설정, 드리프트 감지,
        매수·매도 수량 자동 계산, 월 적립 배분 기능이 추가됩니다.
      </p>
    </div>
  );
}
