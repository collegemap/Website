# Guide: Adding Questions to CBT Portal

## Quick Start

This guide explains how to add questions to the CBT Portal using the image-based approach.

## Step-by-Step Process

### Step 1: Prepare Your Test Folder

1. Navigate to `public/tests/` directory
2. Create a new folder with your test name (e.g., `jee-main-2024-mock-1`)
3. Inside this folder, create three subfolders:
   - `physics/`
   - `chemistry/`
   - `maths/`

### Step 2: Prepare Question Images

1. **For each question**, create an image file containing:
   - The question text
   - Any diagrams, graphs, or figures
   - All necessary information to answer the question

2. **Save images** with these specifications:
   - Format: `.jpg` or `.png`
   - Naming: Number sequentially starting from `1`
   - Example: `1.jpg`, `2.jpg`, `3.jpg`, etc.

3. **Organize by subject**:
   - Physics questions → `physics/` folder
   - Chemistry questions → `chemistry/` folder
   - Maths questions → `maths/` folder

### Step 3: Create Answer Key JSON

1. Create a file named `answerKey.json` in your test folder root
2. Use the structure provided in `TEST_STRUCTURE_README.md`
3. For each question, define:
   - Question number (must match image number)
   - Question type (single-correct, multiple-correct, or integer)
   - Options (if applicable)
   - Correct answer(s)
   - Marks and negative marks

### Step 4: Define Question Types

#### Single Correct Question
```json
{
  "questionNumber": 1,
  "questionType": "single-correct",
  "options": [
    { "optionId": "A", "optionText": "Option A" },
    { "optionId": "B", "optionText": "Option B" },
    { "optionId": "C", "optionText": "Option C" },
    { "optionId": "D", "optionText": "Option D" }
  ],
  "correctAnswer": ["A"],
  "marks": 4,
  "negativeMarks": -1
}
```

#### Multiple Correct Question
```json
{
  "questionNumber": 2,
  "questionType": "multiple-correct",
  "options": [
    { "optionId": "A", "optionText": "Option A" },
    { "optionId": "B", "optionText": "Option B" },
    { "optionId": "C", "optionText": "Option C" },
    { "optionId": "D", "optionText": "Option D" }
  ],
  "correctAnswer": ["A", "C"],
  "marks": 4,
  "negativeMarks": -2
}
```

#### Integer Type Question
```json
{
  "questionNumber": 3,
  "questionType": "integer",
  "correctIntegerAnswer": 42,
  "marks": 4,
  "negativeMarks": 0
}
```

**For integer range answers:**
```json
{
  "questionNumber": 4,
  "questionType": "integer",
  "correctIntegerAnswer": { "min": 40, "max": 45 },
  "marks": 4,
  "negativeMarks": 0
}
```

### Step 5: Complete Answer Key Structure

Your `answerKey.json` should include:

1. **Test metadata**:
   - `paperId`: Unique identifier
   - `paperTitle`: Display title
   - `paperType`: "JEE Main" or "JEE Advanced"
   - `duration`: Duration in seconds (3 hours = 10800)
   - `totalQuestions`: Total number of questions

2. **Sections array** with:
   - `sectionId`: "physics", "chemistry", or "mathematics"
   - `sectionName`: Display name
   - `questionCount`: Number of questions in this section
   - `questions`: Array of question definitions

### Step 6: Register Test in TestData.js

Add your test to the `availableTests` array in `TestData.js`:

```javascript
{
  id: "your-test-name",  // Must match folder name
  title: "Your Test Title",
  type: "JEE Main",
  duration: "3 hours",
  totalQuestions: 75,
  subjects: ["Physics", "Chemistry", "Mathematics"],
  description: "Test description"
}
```

## Checklist

Before publishing your test, ensure:

- [ ] All question images are numbered sequentially (1, 2, 3, ...)
- [ ] Image numbers match question numbers in answerKey.json
- [ ] All images are in correct subject folders
- [ ] answerKey.json is properly formatted and valid JSON
- [ ] Question types are correctly specified
- [ ] Correct answers are defined for all questions
- [ ] Marks and negative marks are set appropriately
- [ ] Test is registered in TestData.js
- [ ] Test folder name matches test ID in TestData.js

## Common Issues and Solutions

### Issue: Images not loading
**Solution**: 
- Check image file names match question numbers
- Verify images are in correct subject folders
- Ensure file extensions are `.jpg` or `.png`
- Check image paths in browser console

### Issue: Answer key not loading
**Solution**:
- Validate JSON syntax using a JSON validator
- Ensure answerKey.json is in test folder root
- Check that all required fields are present

### Issue: Questions not displaying correctly
**Solution**:
- Verify question numbers match image numbers
- Check question type is correctly specified
- Ensure options are defined for single-correct and multiple-correct questions

## Tips

1. **Image Quality**: Use high-resolution images (minimum 1200px width) for better readability
2. **File Size**: Optimize images to reduce load time (aim for < 500KB per image)
3. **Naming**: Be consistent with image naming - always start from 1
4. **Testing**: Test your test locally before publishing
5. **Backup**: Keep a backup of your images and answer key

## Example Workflow

1. Create test folder: `public/tests/my-test/`
2. Add 25 physics images: `physics/1.jpg` through `physics/25.jpg`
3. Add 25 chemistry images: `chemistry/1.jpg` through `chemistry/25.jpg`
4. Add 25 maths images: `maths/1.jpg` through `maths/25.jpg`
5. Create `answerKey.json` with 75 question definitions
6. Register test in `TestData.js`
7. Test the implementation

## Support

For issues or questions, refer to:
- `TEST_STRUCTURE_README.md` for detailed structure information
- `TestData.js` for examples of test registration
- Browser console for debugging image loading issues
