import OpenAI from "openai";
import { DbIdea, Goal } from "sonddr-shared";
import { getDocuments } from "./database.js";

const api_key = process.env.OPENAI_KEY;
const model = "gpt-4o-mini";
const system = "You are a helpful assistant.";

let openai: OpenAI;
export let llm_enabled: boolean;
if (api_key) {
	openai = new OpenAI({
		organization: process.env.OPENAI_ORGANIZATION,
		project: process.env.OPENAI_PROJECT,
		apiKey: api_key,
	});
	llm_enabled = true;
} else {
	llm_enabled = false;
}

export const min_content_length = 1000;

export async function generate_summary(idea: DbIdea): Promise<string> {
	const goals = await getDocuments<Goal>("goals", undefined, {field: "id", operator: "in", value: idea.goalIds});
	const prompt = make_summary_prompt(idea.content, idea.title, goals);
	const result = await openai.chat.completions.create({
		model: model,
		messages: [
			{ role: "system", content: system },
			{ role: "user", content: prompt },
		],
	});
	return result.choices[0].message.content;
}

function make_summary_prompt(content: string, title: string, goals: Goal[]): string {
	const text_content = content.replaceAll(/<[^>]+>/g, "");
	return `A user of my website just posted an idea to achieve the following global goals: ${goals.map(g => g["name-en"]).join(", ")}. Summarize in 1 short sentence their idea. Here is the idea the user posted:

title: ${title}

${text_content}`;
}
