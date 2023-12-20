export default class Line {
    constructor() {
        this.div = document.createElement('div')
        this.div.classList.add('line-container')
        this.audio = null

        const txtDiv = document.createElement('div')
        txtDiv.classList.add('record-area')
        txtDiv.classList.add('editable')
        this.div.txt = txtDiv

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('record-checkbox');
        this.div.checkbox = checkbox
        this.div.appendChild(txtDiv);
        this.div.appendChild(checkbox);
    }

    div() {
        return this.div
    }

    audio() {
        return this.audio
    }

    text() {
        return this.div.txt.innerText
    }

    setText(txt) {
        this.div.txt.innerText = txt
    }

    editable(value) {
        this.div.txt.setAttribute("contenteditable", value)
    }
}
