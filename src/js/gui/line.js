export default class Line {
    constructor() {
        this.div = document.createElement('div')
        this.div.classList.add('line-container')
        this.audio = null

        const txtDiv = document.createElement('div')
        txtDiv.classList.add('record-area')
        txtDiv.classList.add('editable')
        this.txtDiv = txtDiv

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('record-checkbox');
        this.checkbox = checkbox
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
        return this.txtDiv.innerText
    }

    setText(txt) {
        this.txtDiv.innerText = txt
    }

    editable(value) {
        this.txtDiv.setAttribute("contenteditable", value)
    }

    markChecked() {
        this.checkbox.checked = true
    }

    isChecked() {
        return this.checkbox.checked
    }
}
