import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// API: Validate Exam
app.post("/api/validate-exam", (req, res) => {
  const exam = req.body;
  const errors: string[] = [];

  if (!exam.title || exam.title.trim().length < 5) {
    errors.push("Exam title must be at least 5 characters long.");
  }

  if (!exam.subject || exam.subject.trim().length === 0) {
    errors.push("Subject is required.");
  }

  if (!exam.durationMinutes || exam.durationMinutes < 10) {
    errors.push("Exam duration must be at least 10 minutes.");
  }

  if (!exam.questions || exam.questions.length === 0) {
    errors.push("Exam must contain at least one question.");
  } else {
    exam.questions.forEach((q: any, index: number) => {
      if (!q.text || q.text.trim().length < 10) {
        errors.push(`Question ${index + 1} text is too short (min 10 chars).`);
      }
      if (!q.category || q.category.trim().length === 0) {
        errors.push(`Question ${index + 1} must have a category.`);
      }
      if (!q.points || q.points <= 0) {
        errors.push(`Question ${index + 1} must have positive points.`);
      }
      if (q.type === 'multiple-choice') {
        if (!q.options || q.options.length < 2) {
          errors.push(`Question ${index + 1} must have at least 2 options.`);
        } else if (q.options.some((opt: string) => !opt || opt.trim().length === 0)) {
          errors.push(`Question ${index + 1} has empty options.`);
        }
      }
    });
  }

  if (!exam.categories || exam.categories.length === 0) {
    errors.push("Exam must have at least one category derived from questions.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ valid: false, errors });
  }

  res.json({ valid: true });
});

export default app;
