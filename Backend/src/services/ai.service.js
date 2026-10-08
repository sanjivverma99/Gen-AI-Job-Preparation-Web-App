const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

function toGoogleJsonSchema(schema) {
    const jsonSchema = z.toJSONSchema(schema, { target: "draft-7" })
    delete jsonSchema.$schema
    return jsonSchema
}


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `Generate an interview report for a candidate with the following details:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

Respond with ONLY a valid JSON object in EXACTLY this structure (no markdown, no extra text):

{
  "title": "Java Full Stack Developer",
  "matchScore": 85,
  "technicalQuestions": [
    { "question": "Explain REST API design.", "intention": "Test API knowledge.", "answer": "Discuss statelessness, HTTP methods..." }
  ],
  "behavioralQuestions": [
    { "question": "Describe a challenge you faced.", "intention": "Assess problem-solving.", "answer": "STAR method response..." }
  ],
  "skillGaps": [
    { "skill": "Unit Testing", "severity": "medium" }
  ],
  "preparationPlan": [
    { "day": 1, "focus": "Core Java Review", "tasks": ["Review OOP concepts", "Practice coding problems"] }
  ]
}

Generate 5 technicalQuestions, 3 behavioralQuestions, 3 skillGaps, and 5 preparationPlan days, following this EXACT structure with these EXACT field names and types. skillGaps and preparationPlan items MUST be objects, not plain strings.`

    let response
    try {
        response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: toGoogleJsonSchema(interviewReportSchema),
                temperature: 0.3
            }
        })
    } catch (error) {
        error.publicMessage = "The AI report service is unavailable. Please try again later."
        error.status = 502
        throw error
    }

    let parsed
    try {
        parsed = JSON.parse(response.text)
    } catch (error) {
        error.publicMessage = "The AI service returned an invalid report. Please try again."
        error.status = 502
        throw error
    }

    const parseJsonItems = (items) => items.map((item) => {
        if (typeof item !== "string") {
            return item
        }

        try {
            return JSON.parse(item)
        } catch {
            return item
        }
    })

    for (const key of [ "technicalQuestions", "behavioralQuestions", "skillGaps", "preparationPlan" ]) {
        if (Array.isArray(parsed[key])) {
            parsed[key] = parseJsonItems(parsed[key])
        }
    }

    if (Array.isArray(parsed.technicalQuestions)) {
        parsed.technicalQuestions = parsed.technicalQuestions.map(item =>
            typeof item === "string"
                ? { question: item, intention: "Assess relevant knowledge and experience.", answer: "Explain your approach using specific examples." }
                : item
        )
    }

    if (Array.isArray(parsed.behavioralQuestions)) {
        parsed.behavioralQuestions = parsed.behavioralQuestions.map(item =>
            typeof item === "string"
                ? { question: item, intention: "Assess soft skills and past experience.", answer: "Use the STAR method to describe a relevant example." }
                : item
        )
    }

    if (Array.isArray(parsed.skillGaps)) {
        parsed.skillGaps = parsed.skillGaps.map(item =>
            typeof item === "string" ? { skill: item, severity: "medium" } : item
        )
    }

    if (Array.isArray(parsed.preparationPlan)) {
        parsed.preparationPlan = parsed.preparationPlan.map((item, index) =>
            typeof item === "string" ? { day: index + 1, focus: item, tasks: [ item ] } : item
        )
    }

    try {
        return interviewReportSchema.parse(parsed)
    } catch (error) {
        error.publicMessage = "The AI service returned an incomplete report. Please try again."
        error.status = 502
        throw error
    }

}



async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    try {
        const page = await browser.newPage()
        await page.setContent(htmlContent, { waitUntil: "networkidle0" })

        return await page.pdf({
            format: "A4",
            margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm"
            }
        })
    } finally {
        await browser.close()
    }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseJsonSchema: toGoogleJsonSchema(resumePdfSchema)
        }
    })


    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf }