export default async function handler(req, res) {

  const category = req.query.category || "news";

  try {

    let url = "";

    /* =========================
       一般ニュース
    ========================= */

    if (category === "news") {

      url =
        "https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja";

    }


    /* =========================
       天気ニュース
    ========================= */

    else if (category === "weather") {

      const query =
        encodeURIComponent(
          "天気 OR 台風 OR 大雨 OR 大雪 OR 猛暑 OR 気温"
        );

      url =
        `https://news.google.com/rss/search?q=${query}&hl=ja&gl=JP&ceid=JP:ja`;

    }


    /* =========================
       設備投資ニュース
    ========================= */

    else if (category === "investment") {

      const query =
        encodeURIComponent(
          '"新工場" OR "工場新設" OR "設備投資" OR "生産能力増強" OR "増産" OR "新製造棟" OR "新ライン" OR "工場建設" OR "生産拠点"'
        );

      url =
        `https://news.google.com/rss/search?q=${query}&hl=ja&gl=JP&ceid=JP:ja`;

    }


    else {

      return res.status(400).json({
        error: "unknown category"
      });

    }


    /* RSS取得 */

    const response =
      await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });


    if (!response.ok) {

      throw new Error(
        "RSS取得失敗 " +
        response.status
      );

    }


    const xml =
      await response.text();


    /* =========================
       RSS解析
    ========================= */

    const items = [];

    const matches =
      xml.match(
        /<item>[\s\S]*?<\/item>/g
      ) || [];


    for (const item of matches) {

      const titleMatch =
        item.match(
          /<title>([\s\S]*?)<\/title>/
        );

      const linkMatch =
        item.match(
          /<link>([\s\S]*?)<\/link>/
        );


      if (
        !titleMatch ||
        !linkMatch
      ) {
        continue;
      }


      let title =
        decodeXML(
          titleMatch[1]
        );


      let link =
        decodeXML(
          linkMatch[1]
        );


      /* CDATA除去 */

      title =
        title
        .replace("<![CDATA[","")
        .replace("]]>","")
        .trim();


      link =
        link
        .replace("<![CDATA[","")
        .replace("]]>","")
        .trim();


      if (!title || !link) {
        continue;
      }


      items.push({
        title,
        link
      });


      /* 最大50件 */

      if (items.length >= 50) {
        break;
      }

    }


    /* キャッシュ */

    res.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );


    return res.status(200).json({
      category,
      count: items.length,
      items
    });


  }

  catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "ニュースを取得できませんでした"
    });

  }

}


/* =========================
   XML文字変換
========================= */

function decodeXML(text) {

  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

}
