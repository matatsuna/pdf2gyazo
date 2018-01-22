import pdfjsLib from 'pdfjs-dist';
import dragDrop from 'drag-drop';
document.addEventListener("DOMContentLoaded", () => {
    dragDrop('#dropTarget', (files) => {
        files.forEach((file) => {
            console.log(file.type)

            const reader = new FileReader();
            reader.addEventListener('load', (e) => {
                const arr = new Uint8Array(e.target.result);
                pdfjsLib.getDocument(arr).then((pdfDocument) => {
                    console.log('# PDF document loaded.');

                    pdfDocument.getPage(1).then((page) => {
                        const viewport = page.getViewport(1.0);
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        var renderContext = {
                            canvasContext: context,
                            viewport: viewport
                        };
                        page.render(renderContext).then(() => {
                            var image = canvas.toDataURL();
                            console.log(image);
                        });
                    });
                }).catch((reason) => {
                    console.log(reason);
                });
            });
            reader.addEventListener('error', (err) => {
                console.error('FileReader error' + err)
            });
            reader.readAsArrayBuffer(file);
        });
    });


    let elDrop = document.getElementById('dropTarget');
    elDrop.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    elDrop.addEventListener('drop', function (event) {
        event.preventDefault();
    });

});
