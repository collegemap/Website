# CBT Portal - Image-Based Test Structure

## Overview
This CBT Portal uses an image-based approach where questions are stored as images in organized folders. Each test has its own folder structure containing question images and an answer key JSON file.

## Folder Structure

```
public/
└── tests/
    └── [test-name]/
        ├── physics/
        │   ├── 1.jpg (or .png)
        │   ├── 2.jpg
        │   ├── 3.jpg
        │   └── ... (numbered sequentially from 1)
        ├── chemistry/
        │   ├── 1.jpg
        │   ├── 2.jpg
        │   └── ... (numbered sequentially from 1)
        ├── maths/
        │   ├── 1.jpg
        │   ├── 2.jpg
        │   └── ... (numbered sequentially from 1)
        └── answerKey.json
```

## Test Folder Naming Convention

- Use lowercase letters and hyphens for test names
- Examples: `jee-main-2024-mock-1`, `jee-advanced-2024-paper-1`
- The test name should match the `id` field in `TestData.js`

## Image Naming Convention

1. **File Format**: Use `.jpg`, `.jpeg`, or `.png` format
2. **Naming**: Number images sequentially starting from `1`
   - Physics: `1.jpg`, `2.jpg`, `3.jpg`, ...
   - Chemistry: `1.jpg`, `2.jpg`, `3.jpg`, ...
   - Maths: `1.jpg`, `2.jpg`, `3.jpg`, ...
3. **Numbering**: Start from 1 for each subject folder
4. **Consistency**: Ensure all images in a subject folder are numbered consecutively without gaps

## Answer Key JSON Structure

The `answerKey.json` file must be placed in the test folder root and follow this structure:

```json
{
  "paperId": "jee-main-2024-mock-1",
  "paperTitle": "JEE Main 2024 Mock Test - Paper 1",
  "paperType": "JEE Main",
  "duration": 10800,
  "totalQuestions": 75,
  "sections": [
    {
      "sectionId": "physics",
      "sectionName": "Physics",
      "questionCount": 25,
      "questions": [
        {
          "questionNumber": 1,
          "questionType": "single-correct",
          "options": [
            { "optionId": "A", "optionText": "Option A text" },
            { "optionId": "B", "optionText": "Option B text" },
            { "optionId": "C", "optionText": "Option C text" },
            { "optionId": "D", "optionText": "Option D text" }
          ],
          "correctAnswer": ["A"],
          "marks": 4,
          "negativeMarks": -1
        },
        {
          "questionNumber": 2,
          "questionType": "multiple-correct",
          "options": [
            { "optionId": "A", "optionText": "Option A text" },
            { "optionId": "B", "optionText": "Option B text" },
            { "optionId": "C", "optionText": "Option C text" },
            { "optionId": "D", "optionText": "Option D text" }
          ],
          "correctAnswer": ["A", "C"],
          "marks": 4,
          "negativeMarks": -2
        },
        {
          "questionNumber": 3,
          "questionType": "integer",
          "correctIntegerAnswer": 42,
          "marks": 4,
          "negativeMarks": 0
        }
      ]
    },
    {
      "sectionId": "chemistry",
      "sectionName": "Chemistry",
      "questionCount": 25,
      "questions": [
        // Same structure as physics
      ]
    },
    {
      "sectionId": "mathematics",
      "sectionName": "Mathematics",
      "questionCount": 25,
      "questions": [
        // Same structure as physics
      ]
    }
  ]
}
```

## Question Types

### 1. Single Correct (`single-correct`)
- User selects exactly one option
- Requires `options` array with 4 options (A, B, C, D)
- `correctAnswer` is an array with one option ID: `["A"]`

### 2. Multiple Correct (`multiple-correct`)
- User can select multiple options
- Requires `options` array with 4 options (A, B, C, D)
- `correctAnswer` is an array with multiple option IDs: `["A", "C"]`

### 3. Integer Type (`integer`)
- User enters a numeric integer value
- No options required
- `correctIntegerAnswer` can be:
  - A single number: `42`
  - A range: `{ "min": 40, "max": 45 }`

## Marks and Negative Marks

- `marks`: Positive marks awarded for correct answer (typically 4)
- `negativeMarks`: Negative marks for incorrect answer (typically -1 for single-correct, -2 for multiple-correct, 0 for integer)

## Example: Creating a New Test

1. **Create folder structure**:
   ```
   public/tests/jee-main-2024-mock-1/
   ├── physics/
   ├── chemistry/
   ├── maths/
   └── answerKey.json
   ```

2. **Add question images**:
   - Upload images to respective subject folders
   - Name them sequentially: 1.jpg, 2.jpg, 3.jpg, etc.

3. **Create answerKey.json**:
   - Define all question metadata
   - Match question numbers with image numbers
   - Ensure question count matches number of images

4. **Register test in TestData.js**:
   ```javascript
   {
     id: "jee-main-2024-mock-1",
     title: "JEE Main 2024 Mock Test - Paper 1",
     type: "JEE Main",
     duration: "3 hours",
     totalQuestions: 75,
     subjects: ["Physics", "Chemistry", "Mathematics"],
     description: "Comprehensive mock test covering all three subjects"
   }
   ```

## Image Requirements

- **Resolution**: Recommended minimum 1200px width for readability
- **Format**: JPG or PNG
- **Size**: Optimize images to reduce load time (recommended < 500KB per image)
- **Quality**: Ensure text and diagrams are clearly visible
- **Orientation**: Use landscape or portrait as appropriate for the question

## Notes

- The system automatically loads images based on question numbers
- Image paths are constructed as: `/tests/[test-name]/[subject]/[questionNumber].jpg`
- If an image is not found, the system will try `.png` extension
- Question numbers in answerKey.json must match image numbers in folders
