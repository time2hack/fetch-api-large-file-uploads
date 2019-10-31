const form = document.forms['fileUpload'];

console.log(form);

const objectFromFormData = formData => {
  const values = {};
  for (let [key, value] of formData.entries()) {
    if (values[key]) {
      if ( ! (values[key] instanceof Array) ) {
        values[key] = new Array(values[key]);
      }
      values[key].push(value);
    } else {
      values[key] = value;
    }
  }
  return values;
}


document.querySelector('#heavyFile').addEventListener('change', (e) => {
  const data = objectFromFormData(new FormData(form));
  console.log(data);
  console.log(data.heavyFile);

  process(heavyFile)

})

const process = (file) => {
  return new Promise((resolve) => {
    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file)
    fileReader.onloadend = function () {
      if (this.readyState == FileReader.DONE) {
        const slices = [];
        const chunkSize = 20000;
        const name = 'some-random-name';
        const chunks = fileReader.result.byteLength / chunkSize;
        
        for(i = 0; i < fileReader.result.byteLength; i = i+chunkSize) {
          slices.push({
            chunk: i,
            chunks: chunks,
            name: name,
            blob: fileReader.result.slice(i, i+chunkSize),
          })
        }

        resolve(Promises.all(slices.map(a => {
          const url = '/upload'
          const form = new FormData();
          form.append('heavyFile', new Blob([a.blob.buffer], {type: 'application/octet-stream'}));
          const request = new Request(url, {
            method: 'POST',
            //headers: headers,
            body: form
          });

          return fetch(request)
            .then(response => response.json())
            .then(data => { console.log(data); return data; });
        })));
      }
    }
  })
}
