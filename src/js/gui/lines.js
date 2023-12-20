export default class Lines {
    constructor(div) {
        this.lines = []
        this.div = div
    }

    add(line) {
        this.lines.push(line)
        this.div.appendChild(line.div)
    }

    hasText() {
        const children = this.lines

        for (var i = 0; i < this.lines.length; i++) {
            const child = this.lines[i];
            const text = child.text();
            if (text.length > 0) {
                return true
            }
        }
        return false
    }

    editable(value) {
        const children = this.lines
        for (var i = 0; i < this.lines.length; i++) {
            const child = this.lines[i].editable(value);
        }
    }

    clear() {
        this.lines = []
        while (this.div.childElementCount > 0) {
            this.div.removeChild(this.div.lastElementChild);
        }
    }
}
