/**
 * DOCX Generator for Test Analysis Reports (Fallback)
 * Generates comprehensive DOCX reports with question images and analysis
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, ImageRun } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Format time in seconds to readable string
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time
 */
const formatTime = (seconds) => {
  if (!seconds) return '0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  } else if (mins > 0) {
    return `${mins}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

/**
 * Convert image URL to base64 data URL
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<Buffer|null>} Image buffer or null
 */
const imageToBuffer = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.warn('Failed to load image:', error);
    return null;
  }
};

/**
 * Generate DOCX report for test results
 * @param {Object} results - Test results object
 * @param {Object} testData - Test data object
 * @param {Object} imageUrls - Map of questionId to resolved image URLs
 * @param {Object} userProfile - User profile information
 */
export const generateTestAnalysisDOCX = async (results, testData, imageUrls = {}, userProfile = {}) => {
  try {
    console.log('📄 Generating DOCX report...');
    
    const children = [];
    
    // Title
    children.push(
      new Paragraph({
        text: 'Test Analysis Report',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),
      new Paragraph({
        text: testData.paperTitle || 'Test Paper',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 }
      })
    );
    
    // User Information
    children.push(
      new Paragraph({
        text: 'Candidate Information',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Name: ', bold: true }),
          new TextRun({ text: userProfile.name || 'Not Provided' })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Email: ', bold: true }),
          new TextRun({ text: userProfile.email || 'Not Provided' })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Test Date: ', bold: true }),
          new TextRun({ text: new Date().toLocaleDateString() })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Test Time: ', bold: true }),
          new TextRun({ text: new Date().toLocaleTimeString() })
        ],
        spacing: { after: 400 }
      })
    );
    
    // Overall Performance Summary
    children.push(
      new Paragraph({
        text: 'Overall Performance Summary',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Total Questions: ', bold: true }),
          new TextRun({ text: results.totalQuestions.toString() })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Correct Answers: ', bold: true }),
          new TextRun({ text: results.correctAnswers.toString(), color: '22C55E' })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Incorrect Answers: ', bold: true }),
          new TextRun({ text: results.incorrectAnswers.toString(), color: 'EF4444' })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Unattempted: ', bold: true }),
          new TextRun({ text: results.unattempted.toString(), color: 'F59E0B' })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Total Marks: ', bold: true }),
          new TextRun({ text: results.totalMarks.toString() })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Percentage: ', bold: true }),
          new TextRun({ text: `${results.percentage}%` })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Total Time: ', bold: true }),
          new TextRun({ text: formatTime(results.totalTestDuration) })
        ],
        spacing: { after: 400 }
      })
    );
    
    // Section-wise Performance Table
    const sectionTableRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Section')] }),
          new TableCell({ children: [new Paragraph('Correct')] }),
          new TableCell({ children: [new Paragraph('Incorrect')] }),
          new TableCell({ children: [new Paragraph('Unattempted')] }),
          new TableCell({ children: [new Paragraph('Marks')] }),
          new TableCell({ children: [new Paragraph('Time')] })
        ]
      })
    ];
    
    Object.entries(results.sectionWiseResults).forEach(([sectionId, sectionResult]) => {
      sectionTableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(sectionResult.name)] }),
            new TableCell({ children: [new Paragraph(sectionResult.correct.toString())] }),
            new TableCell({ children: [new Paragraph(sectionResult.incorrect.toString())] }),
            new TableCell({ children: [new Paragraph(sectionResult.unattempted.toString())] }),
            new TableCell({ children: [new Paragraph(sectionResult.marks.toString())] }),
            new TableCell({ children: [new Paragraph(formatTime(sectionResult.timeSpent || 0))] })
          ]
        })
      );
    });
    
    children.push(
      new Paragraph({
        text: 'Section-wise Performance',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 }
      }),
      new Table({
        rows: sectionTableRows,
        width: { size: 100, type: WidthType.PERCENTAGE }
      }),
      new Paragraph({ text: '', spacing: { after: 400 } })
    );
    
    // Question-wise Analysis
    children.push(
      new Paragraph({
        text: 'Question-wise Analysis',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 300 }
      })
    );
    
    // Process each question
    for (let i = 0; i < results.questionDetails.length; i++) {
      const question = results.questionDetails[i];
      
      const statusText = question.isCorrect ? '✓ Correct' : 
                        question.userAnswer !== 'Not Attempted' ? '✗ Incorrect' : '○ Unattempted';
      const statusColor = question.isCorrect ? '22C55E' : 
                         question.userAnswer !== 'Not Attempted' ? 'EF4444' : '95A5A6';
      
      children.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Question ${question.questionNumber} - ${question.sectionName}`, 
              bold: true,
              size: 24
            }),
            new TextRun({ text: '  ' }),
            new TextRun({ 
              text: statusText, 
              color: statusColor,
              bold: true
            })
          ],
          spacing: { before: 200, after: 200 }
        })
      );
      
      // Question Image
      if (question.questionImage) {
        const imageUrl = imageUrls[question.questionId] || question.questionImage;
        const imageBuffer = await imageToBuffer(imageUrl);
        
        if (imageBuffer) {
          try {
            children.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imageBuffer,
                    transformation: {
                      width: 500,
                      height: 400
                    }
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
              })
            );
          } catch (imgError) {
            console.warn('Failed to add image to DOCX:', imgError);
          }
        }
      }
      
      // Options (if not integer type)
      if (question.questionType !== 'integer' && question.options && question.options.length > 0) {
        children.push(
          new Paragraph({
            text: 'Options:',
            bold: true,
            spacing: { after: 100 }
          })
        );
        
        question.options.forEach((option) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${option.optionId}. `, bold: true }),
                new TextRun({ text: option.optionText || 'N/A' })
              ],
              spacing: { after: 50 }
            })
          );
        });
      }
      
      // Answer Comparison
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Your Answer: ', bold: true }),
            new TextRun({ 
              text: question.userAnswer || 'Not Attempted',
              color: question.isCorrect ? '22C55E' : 
                    question.userAnswer !== 'Not Attempted' ? 'EF4444' : '95A5A6'
            })
          ],
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Correct Answer: ', bold: true }),
            new TextRun({ 
              text: question.questionType === 'integer' 
                ? (question.correctAnswer || question.correctIntegerAnswer || 'N/A')
                : (question.correctAnswer || 'N/A'),
              color: '22C55E'
            })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Marks Obtained: ', bold: true }),
            new TextRun({ 
              text: question.marks > 0 ? `+${question.marks}` : question.marks.toString(),
              color: question.marks >= 0 ? '22C55E' : 'EF4444'
            })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Time Spent: ', bold: true }),
            new TextRun({ text: formatTime(question.timeSpent || 0) })
          ],
          spacing: { after: 400 }
        })
      );
      
      // Add separator
      if (i < results.questionDetails.length - 1) {
        children.push(
          new Paragraph({
            text: '─────────────────────────────────────────────────────────',
            spacing: { after: 200 }
          })
        );
      }
    }
    
    // Create document
    const doc = new Document({
      sections: [{
        children: children
      }]
    });
    
    // Generate and download
    const blob = await Packer.toBlob(doc);
    const fileName = `Test_Analysis_${(testData.paperTitle || 'Test').replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
    saveAs(blob, fileName);
    
    console.log('✅ DOCX report generated and downloaded');
  } catch (error) {
    console.error('❌ Error generating DOCX:', error);
    throw error;
  }
};
