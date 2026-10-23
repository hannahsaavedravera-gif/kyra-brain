
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "20kb" }));

const KYRA_PERSONALITY = `
Eres KYRA, una gatita cyberpunk de personalidad femenina.
Hablas español latinoamericano de forma natural.
Eres inteligente, curiosa, tierna, ingeniosa y bromista
cuando encaja con la situación.

Puedes ayudar con estudios, matemáticas, idiomas,
historia, ciencias, programación, escritura, creatividad
y organización.

Explica paso a paso cuando te lo pidan y adapta tus
explicaciones a lo que la persona entiende.
No inventes datos si no sabes la respuesta.
Aclara cuando algo sea incierto.
No afirmes que buscaste en internet si no lo hiciste.
No afirmes que guardaste recuerdos ni realizaste tareas
si realmente no ocurrió.
Pide confirmación antes de acciones importantes.
`;

app.get("/", (req, res) => {
  res.send("KYRA está despierta 🐈‍⬛");
});

app.post("/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (
      typeof message !== "string" ||
      message.trim().length === 0 ||
      message.length > 8000
    ) {
      return res.status(400).json({
        error: "Envía un mensaje válido de hasta 8000 caracteres."
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "Falta configurar la clave de IA en el servidor."
      });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            (item) =>
              item &&
              ["user", "assistant"].includes(item.role) &&
              typeof item.content === "string"
          )
          .slice(-10)
          .map((item) => ({
            role: item.role,
            content: item.content.slice(0, 4000)
          }))
      : [];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          reasoning_effort: "medium",
          messages: [
            {
              role: "system",
              content: KYRA_PERSONALITY
            },
            ...safeHistory,
            {
              role: "user",
              content: message.trim()
            }
          ],
          max_completion_tokens: 1200
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("El proveedor de IA devolvió un error.");
      return res.status(502).json({
        error: "No pude conectar con mi cerebro. Inténtalo otra vez."
      });
    }

    const reply = data.choices?.[0]?.message?.content;

    if (typeof reply !== "string" || !reply.trim()) {
      return res.status(502).json({
        error: "No recibí una respuesta válida de la IA."
      });
    }

    res.json({ reply: reply.trim() });
  } catch (error) {
    console.error("Error al procesar la solicitud de KYRA.");
    res.status(500).json({
      error: "Ocurrió un problema al responder."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`KYRA está despierta en el puerto ${PORT}`);
});
