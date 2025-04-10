// src/utils/translator.js
export async function translateText(text, targetLanguage) {
  const endpoint = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT_NAME;
  const apiVersion = process.env.REACT_APP_AZURE_OPENAI_API_VERSION;
  const apiKey = process.env.REACT_APP_AZURE_OPENAI_API_KEY;

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const messages = [
    {
      role: "system",
      content: `You are a helpful translator. Translate everything the user says into ${targetLanguage}.`,
    },
    {
      role: "user",
      content: text,
    },
  ];

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        messages: messages,
        max_tokens: 10000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Translation failed: ${error}`);
    }

    const result = await response.json();
    return result.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error during translation:", error);
    return text; // fallback to original text
  }
}
