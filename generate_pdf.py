"""
Resume PDF Generator
This script converts the resume.html to PDF format
"""

from pathlib import Path

try:
    from weasyprint import HTML, CSS
    
    # Get the resume HTML file
    html_path = Path(__file__).parent / 'resume.html'
    pdf_path = Path(__file__).parent / 'Sonal_Gupta_Resume.pdf'
    
    # Convert HTML to PDF
    HTML(str(html_path)).write_pdf(str(pdf_path))
    print(f"✅ Resume PDF generated successfully: {pdf_path}")
    
except ImportError:
    print("⚠️  WeasyPrint not installed. Installing...")
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "weasyprint"])
    
    from weasyprint import HTML, CSS
    
    html_path = Path(__file__).parent / 'resume.html'
    pdf_path = Path(__file__).parent / 'Sonal_Gupta_Resume.pdf'
    
    HTML(str(html_path)).write_pdf(str(pdf_path))
    print(f"✅ Resume PDF generated successfully: {pdf_path}")

except Exception as e:
    print(f"❌ Error: {e}")
    print("\n📝 Alternative: Open resume.html in a browser and use 'Print to PDF'")
    print("   1. Open resume.html in your browser")
    print("   2. Press Ctrl+P (or Cmd+P on Mac)")
    print("   3. Select 'Save as PDF'")
    print("   4. Save as 'Sonal_Gupta_Resume.pdf'")
