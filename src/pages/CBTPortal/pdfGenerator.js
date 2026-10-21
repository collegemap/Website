/**
 * PDF Generator for Test Analysis Reports
 * Generates comprehensive PDF reports with question images and analysis
 */

import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { generateTestAnalysisDOCX } from './docxGenerator';

/**
 * Convert image URL to base64 data URL
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<string>} Base64 data URL
 */
const imageToBase64 = (imageUrl) => {
  return new Promise((resolve, reject) => {
    // If it's already a data URL, return it
    if (imageUrl.startsWith('data:')) {
      resolve(imageUrl);
      return;
    }

    // Try to fetch the image and convert to blob, then to base64
    fetch(imageUrl)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch image');
        return response.blob();
      })
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.onerror = () => {
          // Fallback to canvas method
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            try {
              const dataURL = canvas.toDataURL('image/jpeg', 0.8);
              resolve(dataURL);
            } catch (error) {
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = imageUrl;
        };
        reader.readAsDataURL(blob);
      })
      .catch(() => {
        // Fallback to canvas method if fetch fails
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          try {
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataURL);
          } catch (error) {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = imageUrl;
      });
  });
};

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
 * Generate PDF report for test results
 * @param {Object} results - Test results object
 * @param {Object} testData - Test data object
 * @param {Object} imageUrls - Map of questionId to resolved image URLs
 * @param {Object} userProfile - User profile information
 * @returns {Promise<jsPDF>} Generated PDF document
 */
export const generateTestAnalysisPDF = async (results, testData, imageUrls = {}, userProfile = {}) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Helper function to add new page if needed
  const checkNewPage = (requiredHeight) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrap
  const addText = (text, x, y, maxWidth, fontSize = 10, align = 'left') => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.setFontSize(fontSize);
    doc.text(lines, x, y, { align });
    return lines.length * (fontSize * 0.35); // Approximate line height
  };

  // Title Page
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Test Analysis Report', pageWidth / 2, 25, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(testData.paperTitle || 'Test Paper', pageWidth / 2, 35, { align: 'center' });

  yPosition = 60;

  // User Information
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Candidate Information', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const userInfo = [
    ['Name:', userProfile.name || 'Not Provided'],
    ['Email:', userProfile.email || 'Not Provided'],
    ['Test Date:', new Date().toLocaleDateString()],
    ['Test Time:', new Date().toLocaleTimeString()]
  ];

  userInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(label, margin, yPosition);
    doc.text(value, margin + 40, yPosition);
    yPosition += 6;
  });

  yPosition += 5;

  // Overall Performance Summary
  checkNewPage(40);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Performance Summary', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const summaryData = [
    ['Total Questions:', results.totalQuestions.toString()],
    ['Correct Answers:', results.correctAnswers.toString()],
    ['Incorrect Answers:', results.incorrectAnswers.toString()],
    ['Fullscreen Exits:', (results.fullscreenExitCount || 0).toString()],
    ['Total Marks:', results.totalMarks.toString()],
    ['Percentage:', `${results.percentage}%`],
    ['Total Time:', formatTime(results.totalTestDuration)]
  ];

  summaryData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 60, yPosition);
    yPosition += 6;
  });

  yPosition += 5;

  // Section-wise Performance
  checkNewPage(50);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Section-wise Performance', margin, yPosition);
  yPosition += 8;

  const sectionTableData = [];
  Object.entries(results.sectionWiseResults).forEach(([sectionId, sectionResult]) => {
    sectionTableData.push([
      sectionResult.name,
      sectionResult.correct.toString(),
      sectionResult.incorrect.toString(),
      sectionResult.unattempted.toString(),
      sectionResult.marks.toString(),
      formatTime(sectionResult.timeSpent || 0)
    ]);
  });

  autoTable(doc, {
    startY: yPosition,
    head: [['Section', 'Correct', 'Incorrect', 'Unattempted', 'Marks', 'Time']],
    body: sectionTableData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin }
  });

  yPosition = doc.lastAutoTable.finalY + 10;

  // Question-wise Analysis
  checkNewPage(30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Question-wise Analysis', margin, yPosition);
  yPosition += 10;

  // Process each question
  for (let i = 0; i < results.questionDetails.length; i++) {
    const question = results.questionDetails[i];
    
    checkNewPage(80); // Reserve space for question

    // Question Header with better spacing
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition - 5, contentWidth, 10, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    const questionHeader = `Question ${question.questionNumber} - ${question.sectionName}`;
    doc.text(questionHeader, margin + 3, yPosition + 2);
    
    // Status badge - improved sizing and positioning
    const statusText = question.isCorrect ? '✓ Correct' : 
                      question.userAnswer !== 'Not Attempted' ? '✗ Incorrect' : '○ Unattempted';
    const statusColor = question.isCorrect ? [46, 204, 113] : 
                       question.userAnswer !== 'Not Attempted' ? [231, 76, 60] : [149, 165, 166];
    
    doc.setFontSize(9);
    const statusWidth = Math.max(doc.getTextWidth(statusText) + 8, 35); // Minimum width to prevent cutoff
    const statusX = pageWidth - margin - statusWidth;
    
    doc.setFillColor(...statusColor);
    // Use roundedRect if available, otherwise use regular rect
    if (doc.roundedRect) {
      doc.roundedRect(statusX, yPosition - 3, statusWidth, 8, 2, 2, 'F');
    } else {
      doc.rect(statusX, yPosition - 3, statusWidth, 8, 'F');
    }
    doc.setTextColor(255, 255, 255);
    doc.text(statusText, statusX + statusWidth / 2, yPosition + 2, { align: 'center' });
    
    yPosition += 12;
    doc.setTextColor(0, 0, 0);

    // Question Image
    if (question.questionImage) {
      const imageUrl = imageUrls[question.questionId] || question.questionImage;
      
      try {
        const base64Image = await imageToBase64(imageUrl);
        if (base64Image) {
          checkNewPage(60);
          
          // Calculate image dimensions to fit page
          const maxWidth = contentWidth;
          const maxHeight = 60; // mm
          
          // Get image dimensions (approximate)
          const img = new Image();
          await new Promise((resolve) => {
            img.onload = resolve;
            img.src = base64Image;
          });
          
          const imgAspectRatio = img.width / img.height;
          let imgWidth = maxWidth;
          let imgHeight = imgWidth / imgAspectRatio;
          
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = imgHeight * imgAspectRatio;
          }
          
          doc.addImage(base64Image, 'JPEG', margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 5;
        }
      } catch (error) {
        console.warn('Failed to load image for PDF:', error);
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('[Image could not be loaded]', margin, yPosition);
        yPosition += 5;
      }
    }

    // Options (if not integer type)
    if (question.questionType !== 'integer' && question.options && question.options.length > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Options:', margin, yPosition);
      yPosition += 5;
      
      question.options.forEach((option) => {
        const optionText = `${option.optionId}. ${option.optionText || 'N/A'}`;
        const optionHeight = addText(optionText, margin + 5, yPosition, contentWidth - 5, 9);
        yPosition += optionHeight + 2;
      });
      
      yPosition += 2;
    }

    // Answer Comparison - improved layout with better spacing
    checkNewPage(30);
    
    // Create a box for answer details
    const answerBoxY = yPosition;
    const answerBoxHeight = 28;
    doc.setFillColor(250, 250, 250);
    // Use roundedRect if available, otherwise use regular rect
    if (doc.roundedRect) {
      doc.roundedRect(margin, answerBoxY, contentWidth, answerBoxHeight, 2, 2, 'F');
    } else {
      doc.rect(margin, answerBoxY, contentWidth, answerBoxHeight, 'F');
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    const labelWidth = 45; // Fixed width for labels
    const valueStartX = margin + labelWidth + 5;
    const lineHeight = 7;
    
    // Your Answer
    doc.setFont('helvetica', 'bold');
    doc.text('Your Answer:', margin + 3, answerBoxY + 5);
    doc.setFont('helvetica', 'normal');
    // Set text color based on answer status
    if (question.isCorrect) {
      doc.setTextColor(46, 204, 113);
    } else if (question.userAnswer !== 'Not Attempted') {
      doc.setTextColor(231, 76, 60);
    } else {
      doc.setTextColor(149, 165, 166);
    }
    const userAnswerText = question.userAnswer || 'Not Attempted';
    const userAnswerHeight = addText(userAnswerText, valueStartX, answerBoxY + 5, contentWidth - labelWidth - 8, 10);
    
    // Correct Answer
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Correct Answer:', margin + 3, answerBoxY + 5 + lineHeight);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(46, 204, 113);
    const correctAnswerDisplay = question.questionType === 'integer' 
      ? (question.correctAnswer || question.correctIntegerAnswer || 'N/A')
      : (question.correctAnswer || 'N/A');
    addText(correctAnswerDisplay, valueStartX, answerBoxY + 5 + lineHeight, contentWidth - labelWidth - 8, 10);
    
    // Marks
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Marks Obtained:', margin + 3, answerBoxY + 5 + (lineHeight * 2));
    doc.setFont('helvetica', 'normal');
    // Set text color based on marks
    if (question.marks >= 0) {
      doc.setTextColor(46, 204, 113);
    } else {
      doc.setTextColor(231, 76, 60);
    }
    const marksText = question.marks > 0 ? `+${question.marks}` : question.marks.toString();
    doc.text(marksText, valueStartX, answerBoxY + 5 + (lineHeight * 2));
    
    // Time Spent
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Time Spent:', margin + 3, answerBoxY + 5 + (lineHeight * 3));
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(formatTime(question.timeSpent || 0), valueStartX, answerBoxY + 5 + (lineHeight * 3));
    
    yPosition = answerBoxY + answerBoxHeight + 5;
    doc.setTextColor(0, 0, 0);

    // Add separator line
    if (i < results.questionDetails.length - 1) {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;
    }
  }

  // Footer on each page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      `Generated on ${new Date().toLocaleString()}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  return doc;
};

/**
 * View PDF report in browser tab
 * @param {Object} results - Test results object
 * @param {Object} testData - Test data object
 * @param {Object} imageUrls - Map of questionId to resolved image URLs
 * @param {Object} userProfile - User profile information
 */
export const downloadTestAnalysisPDF = async (results, testData, imageUrls = {}, userProfile = {}) => {
  try {
    console.log('📄 Starting PDF generation...');
    console.log('📊 Results:', results);
    console.log('📝 Test Data:', testData);
    console.log('🖼️ Image URLs:', Object.keys(imageUrls).length, 'images');
    
    // Show loading message
    const loadingMsg = document.createElement('div');
    loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#10c3bc;color:white;padding:20px 40px;border-radius:10px;z-index:99999;font-size:18px;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
    loadingMsg.textContent = '📄 Generating PDF... Please wait...';
    document.body.appendChild(loadingMsg);
    
    try {
      const doc = await generateTestAnalysisPDF(results, testData, imageUrls, userProfile);
      
      console.log('✅ PDF generated, creating blob...');
      
      // Generate PDF as blob
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      console.log('🌐 Opening PDF in new tab...');
      
      // Try to open in new tab first
      const newWindow = window.open(pdfUrl, '_blank');
      
      if (newWindow) {
        console.log('✅ PDF opened in new tab');
        // Clean up the blob URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
        }, 2000);
      } else {
        // If popup blocked, download instead
        console.warn('⚠️ Popup blocked, downloading PDF instead...');
        const fileName = `Test_Analysis_${(testData.paperTitle || 'Test').replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        
        // Create download link
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
        }, 1000);
        
        console.log('✅ PDF downloaded');
      }
      
      // Remove loading message
      document.body.removeChild(loadingMsg);
      
    } catch (pdfError) {
      // Remove loading message
      if (document.body.contains(loadingMsg)) {
        document.body.removeChild(loadingMsg);
      }
      
      console.error('❌ PDF generation failed, trying DOCX format...', pdfError);
      
      // Fallback to DOCX
      await generateTestAnalysisDOCX(results, testData, imageUrls, userProfile);
    }
    
  } catch (error) {
    console.error('❌ Error generating report:', error);
    console.error('Error stack:', error.stack);
    
    // Show error message
    alert('Failed to generate report. Please check the console for details.');
    throw error;
  }
};
