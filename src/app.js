import pdfjsLib from 'pdfjs-dist';
import dragDrop from 'drag-drop';
import postToGyazo from './postToGyazo';
pdfjsLib.GlobalWorkerOptions.workerSrc = './../../build/pdf.worker.js';

const clientId = '6ceabccbec3aac2dabf990b7ee9549b0cb00d0e280463ade8024d5870efc31c9';
const options = { clientId: clientId };

// http://mozilla.github.io/pdf.js/examples/index.html#interactive-examples
// https://github.com/mozilla/pdf.js/blob/master/examples/node/pdf2png/pdf2png.js

class PDF2Gyazo {
    constructor(file) {
        this.file = file;
        if (file.type !== 'application/pdf') {
            console.error('pdfファイルではありません。');
            return;
        }
    }

    async init(rowLength, lineLength) {
        let binary = await this.fileLoad(this.file);
        let pages = await this.binaryLoad(binary);
        let promisechuild = [];
        for (let i = 1; i <= pages.numPages; i++) {
            let page = await pages.getPage(i);
            promisechuild.push(this.pageRnder(page));
        }
        let images = await Promise.all(promisechuild);

        images = this.imageCombineMatrix(images, rowLength || 1, lineLength || 1);
        console.log(images);

        return images;
    }

    async fileLoad(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            reader.readAsArrayBuffer(file);
        });
    }

    async binaryLoad(binary) {
        const uint8array = new Uint8Array(binary);
        return await pdfjsLib.getDocument(uint8array).promise;
    }

    async pageRnder(page) {
        const viewport = page.getViewport({ scale: 2.0, rotate: 1.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        let renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        await page.render(renderContext).promise;
        return canvas;
    }
    /**
     * 
     * @param {Array} images - canvasの画像配列
     * @param {int} rowLength - 列の数
     * @param {int} lineLength - 行の数
     */
    async imageCombineMatrix(images, rowLength, lineLength) {
        // 基本となる大きさ
        const baseWidth = images[0].width;
        const baseHeight = images[0].height;
        const canvases = [];
        const ctxs = [];
        for (let i = 0; i < images.length / (rowLength * lineLength); i++) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext("2d");
            // imagesの1つめの大きさを縦横掛ける
            canvas.height = baseHeight * lineLength;
            canvas.width = baseWidth * rowLength;
            canvases.push(canvas);
            // 背景を白にする
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctxs.push(ctx);
        }

        for (let i = 0; i < images.length / (rowLength * lineLength); i++) {
            for (let j = 0; j < lineLength; j++) {
                for (let k = 0; k < rowLength; k++) {
                    if ((rowLength * lineLength * i) + j * rowLength + k < images.length) {
                        ctxs[i].drawImage(images[(rowLength * lineLength * i) + j * rowLength + k], k * baseWidth, j * baseHeight, baseWidth, baseHeight);
                    } else {
                        break;
                    }
                }
            }
        }
        return canvases.map((e) => e.toDataURL("image/jpeg"));
    }
}


document.addEventListener("DOMContentLoaded", () => {

    dragDrop('#dropTarget', async (files) => {
        file2image(files);
    });

    document.getElementById('files').addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        file2image(files);
    });

    let elDrop = document.getElementById('dropTarget');
    elDrop.addEventListener('dragover', (event) => {
        elDrop.style.backgroundColor = "rgba(127, 127, 127, 0.2)";
        event.preventDefault();
    });

    elDrop.addEventListener('drop', (event) => {
        elDrop.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
        event.preventDefault();
    });
    elDrop.addEventListener('dragleave', (event) => {
        elDrop.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
        event.preventDefault();
    });

    const file2image = ((files) => {
        let loading = document.getElementById('loading');
        let description = document.getElementById('description');
        let lengthParameter = document.getElementById("lengthParameter");
        loading.style.visibility = 'visible';
        description.style.display = 'none';
        lengthParameter.style.display = 'none';

        // valueとindexの差の1を足す
        let rowLength = document.getElementById("rowLength").selectedIndex + 1;
        let lineLength = document.getElementById("lineLength").selectedIndex + 1;

        let filesimages = files.map(async (file) => {
            let pdf2gyazo = new PDF2Gyazo(file);
            return await pdf2gyazo.init(rowLength, lineLength);
        });
        Promise.all(filesimages).then((_filesimages) => {
            _filesimages.map((fileimages) => fileimages.map((image) => addImage(image)));
        });
    });

    const addImage = ((image) => {
        let table = document.getElementById('imageTable');

        let tr = document.createElement('tr');
        tr.style.width = "100%";
        let imgTd = document.createElement('td');
        imgTd.style.width = "90%";
        let urlTd = document.createElement('td');
        urlTd.style.width = "10%";
        let img = document.createElement('img');
        img.style.width = "100%";
        img.setAttribute('src', image);
        imgTd.appendChild(img);
        let a = document.createElement('a');
        let h4 = document.createElement('h4');
        a.innerText = 'Gyazo';
        h4.appendChild(a);
        a.classList.add("btn");
        a.classList.add("waves-effect");
        a.classList.add("waves-light");
        a.classList.add("white-text");
        a.addEventListener('click', async () => {
            if (a.innerText == 'OPEN') {
                return;
            }

            a.classList.add("disabled");
            a.innerText = 'WAIT';

            let img = new Image();
            img.src = image;
            img.onload = (async () => {

                let compressedImage
                // 容量の概算
                // base64は約4/3に増えるので3/4する
                let volumeMB = image.length / 1024 / 1024 * (3 / 4);
                if (volumeMB > 1) {

                    //ルート取ると削減する画素数が分かるが、反比例しないので0.5を足す(根拠なし)
                    let volumeMBSqrt = Math.sqrt(volumeMB) + 0.5;
                    let imgWidth = img.width * (1 / volumeMBSqrt);
                    let imgHeight = img.height * (1 / volumeMBSqrt);
                    console.log(img.width, imgWidth);
                    console.log(img.height, imgHeight);

                    let canvas = document.createElement("canvas");
                    let ctx = canvas.getContext("2d");
                    canvas.width = imgWidth;
                    canvas.height = imgHeight;


                    ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
                    compressedImage = canvas.toDataURL("image/jpeg", 0.8);
                } else {
                    compressedImage = image
                }
                let data = {
                    imageData: compressedImage,
                    title: "PDF2Gyazo"
                };
                let url = await postToGyazo(data);
                console.log(url);
                a.setAttribute('target', '_blank');
                a.setAttribute('href', url);
                a.innerText = 'OPEN';
                a.classList.remove("disabled");

            });
        });
        urlTd.appendChild(h4);
        tr.appendChild(imgTd);
        tr.appendChild(urlTd);
        table.appendChild(tr);
        elDrop.remove();
    });
    let elems = document.querySelectorAll('select');
    M.FormSelect.init(elems);
});
