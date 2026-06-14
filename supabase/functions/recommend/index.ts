const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { ordered_foods } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("sb_SERVICE_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;

    // 와인 목록 조회
    const winesRes = await fetch(`${supabaseUrl}/rest/v1/wines?is_active=eq.true&select=*`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      }
    });
    const wines = await winesRes.json();

    // 피드백 조회
    const feedbackRes = await fetch(`${supabaseUrl}/rest/v1/feedbacks?score=lte.2&select=score,comment,wine_id`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      }
    });
    const feedbacks = await feedbackRes.json();

    let feedbackText = "";
    if (feedbacks && feedbacks.length > 0) {
      feedbackText = "\n\n[소믈리에 부적합 피드백]\n";
      feedbacks.forEach((f: any) => {
        feedbackText += `- 와인 ${f.wine_id}: ${f.score}점 — ${f.comment || "코멘트 없음"}\n`;
      });
    }

    const wineList = wines.map((w: any) =>
      `${w.wine_id}|${w.type}|${w.name}|${w.name_kr}|${w.region}|${w.grape}|풍미:${w.flavor_notes}`
    ).join("\n");

    const prompt = `당신은 와인웍스 레스토랑의 수석 소믈리에입니다.
아래 테이블의 주문 음식에 가장 잘 어울리는 와인을 메뉴판에서 3종 추천하세요.

[테이블 주문 음식]
${ordered_foods.join(", ")}

[페어링 원칙]
1. 풍미 매칭: 와인 향미가 음식 풍미와 조화
2. 구조 균형: 산도·타닌·당도가 음식과 균형
3. 범용성: 테이블 전체 음식과 가장 많이 어울리는 와인

[와인 메뉴판]
${wineList}
${feedbackText}

순수 JSON만 응답:
{"recommendations":[{"rank":1,"wine_id":"R01","name":"영문명","name_kr":"한국명","region":"산지","grape":"품종","matching_foods":["음식명"]},{"rank":2,"wine_id":"W01","name":"영문명","name_kr":"한국명","region":"산지","grape":"품종","matching_foods":["음식명"]},{"rank":3,"wine_id":"B01","name":"영문명","name_kr":"한국명","region":"산지","grape":"품종","matching_foods":["음식명"]}]}`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const claudeData = await claudeRes.json();
    console.log("Claude response:", JSON.stringify(claudeData));

    const rawText = claudeData.content[0].text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(rawText);

    // 로그 저장
    const logId = `LOG_${Date.now()}`;
    await fetch(`${supabaseUrl}/rest/v1/rec_logs`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        log_id: logId,
        ordered_foods: ordered_foods,
        recommended_wines: result.recommendations.map((r: any) => r.wine_id),
        ai_result_json: result,
      })
    });

    return new Response(
      JSON.stringify({ log_id: logId, ...result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("Error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});