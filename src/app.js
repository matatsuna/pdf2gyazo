import pdfjsLib from 'pdfjs-dist';
import dragDrop from 'drag-drop';
import postToGyazo from './postToGyazo';
// import upload from 'gyazo-browser-upload';

const clientId = '6ceabccbec3aac2dabf990b7ee9549b0cb00d0e280463ade8024d5870efc31c9';
const options = { clientId: clientId };

// http://mozilla.github.io/pdf.js/examples/index.html#interactive-examples
// https://github.com/mozilla/pdf.js/blob/master/examples/node/pdf2png/pdf2png.js

document.addEventListener("DOMContentLoaded", () => {
    dragDrop('#dropTarget', (files) => {
        files.forEach((file) => {
            console.log(file.type);
            if (file.type !== 'application/pdf') {
                console.error('pdfファイルではありません。');
                return;
            }
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

                        let renderContext = {
                            canvasContext: context,
                            viewport: viewport
                        };
                        page.render(renderContext).then(() => {
                            let image = canvas.toDataURL();
                            let data = {
                                imageData: image,
                                title: "PDF2Gyazo",
                                url: "http://127.0.0.1:8080/",
                            };
                            postToGyazo(data);
                            let childWindow = window.open('about:blank');
                            // upload(image, options)
                            //     .then((info) => {
                            //         console.log(info);
                            //         childWindow.location.href = info.url;
                            //         childWindow = null;

                            //         // info.url // URL of the image 
                            //         // info.id // ID of the image 
                            //     }).catch((e) => {
                            //         console.log(e);
                            //         childWindow.close();
                            //         childWindow = null;
                            //     });
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
        elDrop.style.backgroundColor = "rgba(127, 127, 127, 0.2)";
        event.preventDefault();
    });

    elDrop.addEventListener('drop', function (event) {
        elDrop.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
        event.preventDefault();
    });
    elDrop.addEventListener('dragleave', function (event) {
        elDrop.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
        event.preventDefault();
    });

});
