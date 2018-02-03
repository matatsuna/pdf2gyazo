import pdfjsLib from 'pdfjs-dist';
import dragDrop from 'drag-drop';
import postToGyazo from './postToGyazo';

const clientId = '6ceabccbec3aac2dabf990b7ee9549b0cb00d0e280463ade8024d5870efc31c9';
const options = { clientId: clientId };

// http://mozilla.github.io/pdf.js/examples/index.html#interactive-examples
// https://github.com/mozilla/pdf.js/blob/master/examples/node/pdf2png/pdf2png.js

document.addEventListener("DOMContentLoaded", () => {
    let table = document.getElementById('imageTable');
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
                            let image = canvas.toDataURL("image/jpeg");
                            let data = {
                                imageData: image,
                                title: "PDF2Gyazo"
                            };
                            postToGyazo(data).then((url) => {
                                addImage(image, url);
                            });

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
    function addImage(image, url) {
        let tr = document.createElement('tr');
        let imgTd = document.createElement('td');
        let urlTd = document.createElement('td');
        let img = document.createElement('img');
        img.setAttribute('src', image);
        imgTd.appendChild(img);
        let a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('target', '_blank');
        let h4 = document.createElement('h4');
        a.innerText = 'Gyazoで開く';
        h4.appendChild(a);
        urlTd.appendChild(h4);
        tr.appendChild(imgTd);
        tr.appendChild(urlTd);
        table.appendChild(tr);
    }
});

