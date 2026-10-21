# Question Format for CBT Portal

## How to Add Questions

To add questions to a test paper, edit the `TestData.js` file and follow the structure below.

## Question Data Structure

Each test paper follows this structure:

```javascript
{
  paperId: "unique-paper-id",           // Unique identifier for the paper
  paperTitle: "Paper Title",           // Display title
  paperType: "JEE Main | JEE Advanced", // Type of test
  duration: 10800,                     // Duration in seconds (3 hours = 10800)
  totalQuestions: 75,                  // Total questions (25 per subject)
  sections: [
    {
      sectionId: "physics",            // Unique section ID
      sectionName: "Physics",          // Display name
      questions: [
        {
          questionId: "phy-1",         // Unique question ID
          questionNumber: 1,            // Question number in section
          questionText: "Question text here...", // Can include HTML
          questionImage: "URL or path to image (optional)", // For image-based questions
          questionType: "single-correct | multiple-correct | integer",
          correctIntegerAnswer: "number OR { min: number, max: number } (for integer type only)",
          options: [
            {
              optionId: "A",            // Display identifier (A, B, C, D, etc.) - stays in order
              optionKey: "unique-key-1", // Unique key for this option (required)
              optionText: "Option text"
            }
          ],
          correctAnswer: ["A"],         // For display/backward compatibility
          correctAnswerKeys: ["unique-key-1"], // Array of unique keys for correct answers (required)
          marks: 4,                     // Positive marks for correct answer
          negativeMarks: -1,           // Negative marks for wrong answer
          subject: "Physics",          // Subject name
          topic: "Kinematics",         // Optional: Topic name
          difficulty: "Easy | Medium | Hard" // Optional: Difficulty level
        }
      ]
    },
    {
      sectionId: "chemistry",
      sectionName: "Chemistry",
      questions: [] // Same structure as Physics
    },
    {
      sectionId: "mathematics",
      sectionName: "Mathematics",
      questions: [] // Same structure as Physics
    }
  ]
}
```

## Example Question

```javascript
{
  questionId: "phy-1",
  questionNumber: 1,
  questionText: "A particle moves in a straight line with constant acceleration. If it covers distances s₁ and s₂ in successive intervals of time t₁ and t₂, then the acceleration is:",
  questionImage: null, // or "https://example.com/image.png" for image-based questions
  questionType: "single-correct",
  options: [
    { optionId: "A", optionKey: "phy-1-opt-1", optionText: "2(s₁t₂ - s₂t₁) / (t₁t₂(t₁ + t₂))" },
    { optionId: "B", optionKey: "phy-1-opt-2", optionText: "2(s₂t₁ - s₁t₂) / (t₁t₂(t₁ + t₂))" },
    { optionId: "C", optionKey: "phy-1-opt-3", optionText: "2(s₁t₂ + s₂t₁) / (t₁t₂(t₁ + t₂))" },
    { optionId: "D", optionKey: "phy-1-opt-4", optionText: "2(s₁t₂ - s₂t₁) / (t₁t₂(t₁ - t₂))" }
  ],
  correctAnswer: ["A"],
  correctAnswerKeys: ["phy-1-opt-1"],
  marks: 4,
  negativeMarks: -1,
  subject: "Physics",
  topic: "Kinematics",
  difficulty: "Medium"
}
```

## Multiple Correct Answer Example

```javascript
{
  questionId: "chem-2",
  questionNumber: 2,
  questionText: "Which of the following are correct? (Select all that apply)",
  questionType: "multiple-correct",
  options: [
    { optionId: "A", optionKey: "chem-2-opt-1", optionText: "Option A" },
    { optionId: "B", optionKey: "chem-2-opt-2", optionText: "Option B" },
    { optionId: "C", optionKey: "chem-2-opt-3", optionText: "Option C" },
    { optionId: "D", optionKey: "chem-2-opt-4", optionText: "Option D" }
  ],
  correctAnswer: ["A", "C"],
  correctAnswerKeys: ["chem-2-opt-1", "chem-2-opt-3"],  // Multiple correct answers using unique keys
  marks: 4,
  negativeMarks: -1,
  subject: "Chemistry"
}
```

## Steps to Add a New Paper

1. Open `src/pages/CBTPortal/TestData.js`
2. Create a new paper object following the structure above
3. Add it to the `availableTests` array
4. Make sure the `paperData` property points to your paper object

## Image-Based Questions

To add an image to a question, set the `questionImage` field:

```javascript
{
  questionId: "phy-2",
  questionNumber: 2,
  questionText: "Refer to the diagram below:",
  questionImage: "https://example.com/diagram.png", // or "/images/question2.png"
  questionType: "single-correct",
  // ... rest of question data
}
```

The image will be displayed above the question text. Supported formats: PNG, JPG, JPEG, GIF, SVG.

## Integer Type Question Example

```javascript
{
  questionId: "math-3",
  questionNumber: 3,
  questionText: "If the sum of the first n terms of an arithmetic progression is 3n² + 5n, then find the 10th term:",
  questionType: "integer",
  options: [], // No options for integer type
  correctAnswer: null, // Not used for integer type
  correctAnswerKeys: null, // Not used for integer type
  correctIntegerAnswer: 65, // Single integer value
  // OR for range: { min: 64, max: 66 }
  marks: 4,
  negativeMarks: -1,
  subject: "Mathematics"
}
```

## Notes

- Each section should have exactly 25 questions (currently set to 1 for testing)
- Question IDs must be unique across all sections
- Option IDs (A, B, C, D) stay in order - they are NOT shuffled
- Each option MUST have a unique `optionKey` (e.g., "phy-1-opt-1", "phy-1-opt-2")
- `correctAnswerKeys` stores the unique keys of correct options (required for multiple choice)
- `correctAnswer` is kept for backward compatibility but `correctAnswerKeys` is used for evaluation
- Questions are shuffled but options remain in order (A, B, C, D)
- Option texts are shuffled but optionIds (A, B, C, D) stay in order
- For single-correct questions, `correctAnswerKeys` should have one element
- For multiple-correct questions, `correctAnswerKeys` can have multiple elements
- For integer questions, use `correctIntegerAnswer` (single number or range object)
- Single correct options use circular radio buttons
- Multiple correct options use square checkboxes with explicit "Multiple Correct" badge
- The system automatically calculates results based on correct/incorrect answers using unique keys
- Images can be hosted externally (URL) or locally (path in public folder)

