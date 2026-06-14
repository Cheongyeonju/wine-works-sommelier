import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { ordered_foods } = await req.json();

    if (!ordered_foods || ordered_foods.length === 0) {
      return new Response(JSON.stringify({ error: "음식 목록이 없습니다." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Supabase 클라이언트
    const supabase = createClient(
      Deno.env.get("SB_URL")!,
      Deno.env.get("SB_SERVICE_KEY")!
    );

    // 와인 목록 조회
    const { data: wines } = await supabase
      .from("wines")
      .select("*")
      .eq("is_active", true);

    // 관련 피드백 조회
    const { data: feedbacks } = await supabase
      .from("feedbacks")
      .select(`
        score,
        comment,
        wine_id,
        rec_logs (ordered_foods)
      `)
      .lte("score", 2);

    // 피드백 텍스트 생성
    let feedbackText = "";
    if (feedbacks && feedbacks.length > 0) {
      feedbackText = "\n\n[소믈리에 부적합 피드백 기록 — 아래 조합은 피하거나 순위를 낮추세요]\n";
      feedbacks.forEach((f: any) => {
        const foods = f.rec_logs?.ordered_foods?.join(", ") || "";
        feedbackText += `- 음식조합 [${foods}] + 와인 ${f.wine_id}: ${f.score}점 — ${f.comment || "코멘트 없음"}\n`;
      });
    }

    // 와인 목록 텍스트 생성
    const wineList = wines!.map((w: any) =>
      `${w.wine_id}|${w.type}|${w.name}|${w.name_kr}|${w.region}|${w.grape}|풍미:${w.flavor_notes}`
    ).join("\n");

    // Claude API 호출
    const prompt = `당신은 와인웍스 레스토랑의 수석 소믈리에입니다.
아래 테이블의 주문 음식에 가장 잘 어울리는 와인을 메뉴판에서 3종 추천하세요.

[테이블 주문 음식]
${ordered_foods.join(", ")}

[페어링 원칙 — 반드시 이 3가지 기준으로 선정]
1. 풍미 매칭: 와인 향미가 음식 풍미와 조화를 이루는지
2. 구조 균형: 와인 산도·타닌·당도가 음식 지방·단백질·소스와 균형을 맞추는지
3. 범용성: 테이블 전체 음식 중 가장 많은 음식과 어울리는지

[와인 메뉴판 (wine_id|type|name|name_kr|region|grape|flavor)]
${wineList}
${feedbackText}

아래 JSON 형식으로만 응답하세요. 마크다운 없이 순수 JSON만:
{
  "recommendations": [
    {
      "rank": 1,
      "wine_id": "R01",
      "name": "와인 영문명",
      "name_kr": "와인 한국명",
      "region": "산지",
      "grape": "품종",
      "matching_foods": ["이 음식과 잘 어울림", "이 음식과도 잘 어울림"]
    },
    { "rank": 2, ... },
    { "rank": 3, ... }
  ]
}

matching_foods는 테이블 주문 음식 중 이 와인과 특히 잘 어울리는 것만 골라서 넣으세요.`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const claudeData = await claudeRes.json();
    const rawText = claudeData.content[0].text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(rawText);

    // 추천 이력 저장
    const logId = `LOG_${Date.now()}`;
    await supabase.from("rec_logs").insert({
      log_id: logId,
      ordered_foods: ordered_foods,
      recommended_wines: result.recommendations.map((r: any) => r.wine_id),
      ai_result_json: result,
    });

    return new Response(
      JSON.stringify({ log_id: logId, ...result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
