import { ref } from 'vue';
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker using CDN to avoid Vite build issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export function usePdf() {
    const isExtracting = ref(false);
    const pdfError = ref(null);

    const extractTextFromPdf = async (file) => {
        isExtracting.value = true;
        pdfError.value = null;
        let fullText = "";

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + "\n\n";
            }
        } catch (err) {
            console.error("PDF Extraction Error:", err);
            pdfError.value = "Impossible de lire le fichier PDF. Assurez-vous qu'il contient du texte (pas juste des images).";
        } finally {
            isExtracting.value = false;
        }

        return fullText;
    };

    return {
        extractTextFromPdf,
        isExtracting,
        pdfError
    };
}
