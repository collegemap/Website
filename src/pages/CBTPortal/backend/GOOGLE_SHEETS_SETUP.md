# Google Sheets API Setup Guide

This guide will help you set up Google Sheets API integration to save test results automatically.

## Prerequisites

1. A Google account
2. Access to Google Cloud Console
3. A Google Sheet where you want to store the results

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "CBT Test Results")
5. Click "Create"

## Step 2: Enable Google Sheets API

1. In your project, go to "APIs & Services" > "Library"
2. Search for "Google Sheets API"
3. Click on it and click "Enable"

## Step 3: Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Enter a name (e.g., "cbt-test-results-service")
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

## Step 4: Create Service Account Key

1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Click "Create" - this will download a JSON file
6. **IMPORTANT**: Keep this file secure and never commit it to version control

## Step 5: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Name it (e.g., "CBT Test Results")
4. Note the Sheet ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
   - Copy the `SHEET_ID` part

## Step 6: Share Sheet with Service Account

1. In your Google Sheet, click "Share" button
2. Paste the email address from your service account JSON file (it looks like: `your-service-account@project-id.iam.gserviceaccount.com`)
3. Give it "Editor" permissions
4. Click "Send"

## Step 7: Set Up Backend API

You have two options:

### Option A: Use Vercel Serverless Function (Recommended)

1. Create a file: `api/cbt/test-results.js` in your Vercel project
2. Install dependencies:
   ```bash
   npm install googleapis
   ```
3. Create the API endpoint (see example below)

### Option B: Use Node.js/Express Backend

1. Create a backend server
2. Install dependencies:
   ```bash
   npm install googleapis express cors
   ```
3. Create the API endpoint (see example below)

## Step 8: Environment Variables

Create a `.env` file (or set in Vercel dashboard):

```env
GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY=path/to/service-account-key.json
GOOGLE_SHEETS_SPREADSHEET_ID=your-sheet-id-here
```

Or if using Vercel, you can store the JSON key as an environment variable:

```env
GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
GOOGLE_SHEETS_SPREADSHEET_ID=your-sheet-id-here
```

## Step 9: Example API Endpoint Code

### For Vercel (api/cbt/test-results.js):

```javascript
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Get credentials from environment
      const credentials = JSON.parse(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY);
      const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

      // Authenticate
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });

      const {
        testId,
        testTitle,
        totalMarks,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        unattempted,
        percentage,
        totalTestDuration,
        sectionWiseResults,
        fullscreenExitCount,
        questionDetails
      } = req.body;

      const userProfile = JSON.parse(req.headers['x-user-profile'] || '{}');

      // Prepare row data
      const row = [
        new Date().toISOString(),
        userProfile.email || 'Unknown',
        userProfile.name || 'Unknown',
        testId,
        testTitle,
        totalMarks,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        unattempted,
        percentage,
        totalTestDuration,
        fullscreenExitCount || 0,
        JSON.stringify(sectionWiseResults),
        JSON.stringify(questionDetails)
      ];

      // Append to sheet
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A:O',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [row],
        },
      });

      res.status(200).json({
        success: true,
        message: 'Test results saved successfully',
        sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
      });
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  } else if (req.method === 'GET') {
    try {
      // Get credentials from environment
      const credentials = JSON.parse(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY);
      const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

      // Authenticate
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });

      const userProfile = JSON.parse(req.headers['x-user-profile'] || '{}');
      const userEmail = userProfile.email;

      // Read all data
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Sheet1!A:O',
      });

      const rows = response.data.values || [];
      
      // Skip header row
      const dataRows = rows.slice(1);
      
      // Filter by email if provided
      const userResults = userEmail 
        ? dataRows.filter(row => row[1] === userEmail)
        : dataRows;

      // Convert to test results format
      const testResults = userResults.map(row => ({
        testId: row[3],
        testTitle: row[4],
        totalMarks: parseFloat(row[5]) || 0,
        totalQuestions: parseInt(row[6]) || 0,
        correctAnswers: parseInt(row[7]) || 0,
        incorrectAnswers: parseInt(row[8]) || 0,
        unattempted: parseInt(row[9]) || 0,
        percentage: parseFloat(row[10]) || 0,
        totalTestDuration: parseInt(row[11]) || 0,
        fullscreenExitCount: parseInt(row[12]) || 0,
        sectionWiseResults: JSON.parse(row[13] || '{}'),
        questionDetails: JSON.parse(row[14] || '[]'),
        completedAt: row[0]
      }));

      res.status(200).json({
        success: true,
        testResults
      });
    } catch (error) {
      console.error('Error reading from Google Sheets:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        testResults: []
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
```

## Step 10: Sheet Headers

Make sure your Google Sheet has these sheets with correct headers:

### **ResourceAnalytics Sheet** (for resource tracking)
| Resource ID | Resource Title | Subject | Type | Number of Views | Number of Downloads | Last Updated |
|-------------|----------------|---------|------|-----------------|---------------------|--------------|

### **CBTTestResults Sheet** (for test results)
| Timestamp | User Name | User Email | Test ID | Test Title | Total Marks | Total Questions | Correct | Incorrect | Unattempted | Percentage | Duration (s) | Section Results |
|-----------|-----------|-----------|---------|------------|-------------|-----------------|---------|-----------|-------------|------------|--------------|-----------------|

### **Bookings Sheet** (for seminar bookings)
| Timestamp | Name | Email | Phone |
|-----------|------|-------|-------|

## Step 11: Update Frontend API URL

In your frontend code, update the API URL to point to your backend:

```javascript
// In TestInterface.jsx and CBTDashboard.jsx
const API_URL = 'https://your-vercel-app.vercel.app/api/cbt/test-results';
// Or if using custom backend:
const API_URL = 'https://your-backend.com/api/cbt/test-results';
```

## Security Notes

1. **Never commit service account keys to version control**
2. **Use environment variables for sensitive data**
3. **Restrict service account permissions to only what's needed**
4. **Consider rate limiting for production use**
5. **Add authentication/authorization for API endpoints**

## Testing

1. Complete a test in your application
2. Check your Google Sheet - a new row should appear
3. Check the dashboard - results should load from Google Sheets

## Troubleshooting

- **403 Error**: Make sure the service account email has Editor access to the sheet
- **404 Error**: Check that the Sheet ID is correct
- **Authentication Error**: Verify the service account key JSON is correct
- **No data appearing**: Check the range in your API code matches your sheet structure

## Alternative: Use Google Apps Script

If you prefer not to set up a backend, you can use Google Apps Script:

1. Open your Google Sheet
2. Go to Extensions > Apps Script
3. Create a web app that receives POST requests
4. Use the Sheet API to append data
5. Deploy as a web app and use the URL in your frontend

This is simpler but less secure for production use.
