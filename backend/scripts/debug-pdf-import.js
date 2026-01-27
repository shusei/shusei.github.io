// Polyfill
if (typeof Promise.withResolvers === 'undefined') {
    Promise.withResolvers = function () {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}
if (!global.DOMMatrix) {
    global.DOMMatrix = class DOMMatrix {
        constructor() { return this; }
        translate() { return this; }
        scale() { return this; }
        multiply() { return this; }
        transformPoint() { return { x: 0, y: 0 }; }
    };
}

const pdf = require('pdf-parse');

// Minimal PDF 1.4 header + body
const minimalPdf = Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 21 >>
stream
BT /F1 24 Tf (Hello) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000222 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
293
%%EOF
`);

(async () => {
    try {
        console.log('Attempting new pdf.PDFParse(minimalPdf)...');
        const instance = new pdf.PDFParse(new Uint8Array(minimalPdf));
        console.log('new pdf.PDFParse success!');

        console.log('Calling getText()...');
        const result = await instance.getText();
        console.log('getText() result type:', typeof result);
        console.log('getText() result keys:', result ? Object.keys(result) : 'null');
        console.log('getText() result:', result);
    } catch (e) {
        console.log('new pdf.PDFParse failed:', e.message);
    }
})();
