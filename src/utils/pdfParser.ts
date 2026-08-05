import * as pdfjsLib from 'pdfjs-dist';

// Set up pdf.js worker URL from cdnjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';
    const numPages = pdf.numPages;

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += `\n--- Страница ${i} ---\n` + pageText;
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error parsing PDF file:', error);
    // Fallback: if browser blocks external CDN worker, attempt reading text if it's text-like or throw clear message
    throw new Error('Не удалось прочитать PDF файл. Убедитесь, что файл не защищен паролем.');
  }
}
