export default class Lines {
  constructor (div) {
    this.lines = []
    this.div = div
  }

  add (line) {
    this.lines.push(line)
    this.div.appendChild(line.div)
  }

  hasText () {
    for (let i = 0; i < this.lines.length; i++) {
      const child = this.lines[i]
      const text = child.text()
      if (text.length > 0) {
        return true
      }
    }
    return false
  }

  editable (value) {
    for (let i = 0; i < this.lines.length; i++) {
      this.lines[i].editable(value)
    }
  }

  clear () {
    this.lines = []
    while (this.div.childElementCount > 0) {
      this.div.removeChild(this.div.lastElementChild)
    }
  }

  selectAll () {
    for (let i = 0; i < this.lines.length; i++) {
      this.lines[i].markChecked()
    }
  }

  getSelectedText () {
    let res = ''
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i]
      if (line.isChecked()) {
        if (res.length > 0) {
          res += '\n'
        }
        res += line.text()
      }
    }
    return res
  }
}
