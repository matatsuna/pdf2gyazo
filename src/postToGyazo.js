import FormData from 'form-data';


// https://github.com/gyazo/gyazo-browser-extension/blob/master/src/libs/postToGyazo.js

const apiEndpoint = 'https://upload.gyazo.com/api/upload/easy_auth';
const clientId = '6ceabccbec3aac2dabf990b7ee9549b0cb00d0e280463ade8024d5870efc31c9';

const errorAlert = (status, message) => {
    window.alert('Status: ' + status + '\n Error: ' + message)
}

function postToGyazo(data) {
    return new Promise((resolve) => {
        var formdata = new FormData();
        formdata.append('client_id', clientId);
        formdata.append('image_url', data.imageData);
        formdata.append('title', data.title);
        formdata.append('referer_url', data.imageData);
        formdata.append('scale', data.scale || '');
        formdata.append('desc', data.desc ? data.desc.replace(/\t/, ' ').replace(/(^\s+| +$)/gm, '') : '');
        window.fetch(apiEndpoint, {
            method: 'POST',
            mode: 'cors',
            body: formdata
        }).then((response) => {
            if (response.status >= 400) {
                errorAlert(response.status, response.statusText)
            }
            return response.json()
        }).then((_data) => {
            resolve(_data.get_image_url)
        });
    });
}

export default postToGyazo;