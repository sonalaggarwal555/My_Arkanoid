/**
 * Resume PDF Generator using Node.js
 * Install dependencies: npm install puppeteer
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generateResumePDF() {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        // Load the HTML file
        const htmlPath = `file://${path.resolve(__dirname, 'resume.html')}`;
        
        await page.goto(htmlPath, {
            waitUntil: 'networkidle2'
        });
        
        // Generate PDF
        const pdfPath = path.resolve(__dirname, 'Sonal_Gupta_Resume.pdf');
        
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            margin: {
                top: '0.5in',
                bottom: '0.5in',
                left: '0.5in',
                right: '0.5in'
            },
            printBackground: true
        });
        
        await browser.close();
        
        console.log('✅ Resume PDF generated successfully!');
        console.log(`📄 File saved to: ${pdfPath}`);
        
    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        console.log('\n📝 Alternative: Open resume.html in a browser and use Print to PDF');
        console.log('   1. Open resume.html in your browser');
        console.log('   2. Press Ctrl+P (or Cmd+P on Mac)');
        console.log('   3. Select "Save as PDF"');
        console.log('   4. Save as "Sonal_Gupta_Resume.pdf"');
    }
}

generateResumePDF();
