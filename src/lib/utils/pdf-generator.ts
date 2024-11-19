import PDFDocument from 'pdfkit';
import fs from 'fs';

export async function generateWhitepaperPDF() {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50
  });

  // Pipe its output somewhere, like to a file or HTTP response
  doc.pipe(fs.createWriteStream('public/whitepaper.pdf'));

  // Add content
  doc
    .fontSize(25)
    .text('$GOON Token Whitepaper', {
      align: 'center'
    })
    .moveDown(2);

  // Add sections
  addSection(doc, 'Introduction', [
    'The $GOON token represents a revolutionary approach to payment processing in the adult industry...'
  ]);

  // Add more sections...

  // Finalize PDF file
  doc.end();
}

function addSection(doc: PDFKit.PDFDocument, title: string, content: string[]) {
  doc
    .fontSize(16)
    .text(title, { underline: true })
    .moveDown(1);

  content.forEach(paragraph => {
    doc
      .fontSize(12)
      .text(paragraph)
      .moveDown(1);
  });
} 