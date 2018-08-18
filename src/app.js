import pdfjsLib from 'pdfjs-dist';
import dragDrop from 'drag-drop';
import postToGyazo from './postToGyazo';
pdfjsLib.GlobalWorkerOptions.workerSrc = '../../build/pdf.worker.js';

const clientId = '6ceabccbec3aac2dabf990b7ee9549b0cb00d0e280463ade8024d5870efc31c9';
const options = { clientId: clientId };

// http://mozilla.github.io/pdf.js/examples/index.html#interactive-examples
// https://github.com/mozilla/pdf.js/blob/master/examples/node/pdf2png/pdf2png.js

class PDF2Gyazo{
    constructor(file){
        this.file = file;
        if (file.type !== 'application/pdf') {
            console.error('pdfファイルではありません。');
            return;
        }
    }

    async init(){
        let binary = await this.fileLoad(this.file);
        let pages = await this.binaryLoad(binary);
        let promisechuild = [];
        for(let i =1;i<=pages.numPages;i++){
            let page = await pages.getPage(i);
            promisechuild.push(this.pageRnder(page));
        }
        let images = await Promise.all(promisechuild);
        return images;
    }

    async fileLoad(file){
        return new Promise((resolve)=>{
            const reader = new FileReader();
            reader.onload = (e)=>{
                resolve(e.target.result);
            };
            reader.readAsArrayBuffer(file);
        });
    }

    async binaryLoad(binary){
        const uint8array = new Uint8Array(binary);
        return await pdfjsLib.getDocument(uint8array);
    }

    async pageRnder(page){
        const viewport = page.getViewport(1.0);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        let renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        await page.render(renderContext);
        return canvas.toDataURL("image/jpeg");
    }
}


document.addEventListener("DOMContentLoaded", () => {
    let table = document.getElementById('imageTable');
    dragDrop('#dropTarget', async(files) => {
        let filesimages =files.map(async(file) => {
                let pdf2gyazo = new PDF2Gyazo(file);
                return await pdf2gyazo.init();
        });
        Promise.all(filesimages).then((_filesimages)=>{
            _filesimages.map((fileimages)=>fileimages.map((image)=>addImage(image)));
        });
    });

    document.getElementById('files').addEventListener('change', (e)=>{
        const files = Array.from(e.target.files);
        let filesimages =files.map(async(file) => {
        let pdf2gyazo = new PDF2Gyazo(file);
            return await pdf2gyazo.init();
        });
        Promise.all(filesimages).then((_filesimages)=>{
            _filesimages.map((fileimages)=>fileimages.map((image)=>addImage(image)));
        });
    });

    let elDrop = document.getElementById('dropTarget');
    elDrop.addEventListener('dragover', (event) => {
        elDrop.style.backgroundColor = "rgba(127, 127, 127, 0.2)";
        event.preventDefault();
    });

    elDrop.addEventListener('drop',  (event)=> {
        elDrop.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
        event.preventDefault();
    });
    elDrop.addEventListener('dragleave', (event)=> {
        elDrop.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
        event.preventDefault();
    });
    function addImage (image){
        let tr = document.createElement('tr');
        let imgTd = document.createElement('td');
        let urlTd = document.createElement('td');
        let img = document.createElement('img');
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
        a.addEventListener('click',async()=>{
            if(a.innerText == 'OPEN'){
                return;
            }
            let data = {
                imageData: image,
                title: "PDF2Gyazo"
            };
            let url = await postToGyazo(data);
            console.log(url);
            a.setAttribute('target', '_blank');
            a.setAttribute('href', url);
            a.innerText = 'OPEN';
        });
        urlTd.appendChild(h4);
        tr.appendChild(imgTd);
        tr.appendChild(urlTd);
        table.appendChild(tr);
        elDrop.remove();
    }
});

