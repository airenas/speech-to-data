export default class Clip {
  // extractDivText(div) {
  //   console.log(`int children len ${div.children.length}`)
  //   if (div.children.length === 0) {
  //     return div.innerText
  //   }

  //   let text = div.innerHTML
  //   text = text.replaceAll("<div>", "\n");
  //   text = text.replaceAll("</div>", "");
  //   text = text.replaceAll("<br>", "");
  //   return text
  // }

  // extractText(div) {
  //   console.log(`children ${div.children.length}`)
  //   let text = ""
  //   for (var i = 0; i < div.children.length; i++) {
  //     if (text.length > 0) {
  //       text += "\n"
  //     }
  //     text += this.extractDivText(div.children[i])
  //   }
  //   return text
  // }

  // copy(div, onWrote) {
  //   var tempDiv = document.createElement('div');
  //   tempDiv.innerHTML = div.innerHTML;
  //   console.log(`html '${tempDiv.innerHTML}'`)
  //   console.log(`html orig '${tempDiv.innerHTML}'`)
  //   const text = this.extractText(tempDiv);
  //   tempDiv.remove();
  //   navigator.clipboard.writeText(text).then(onWrote)
  //     .catch(function (err) {
  //       console.error('Failed to copy: ', err);
  //     });
  // }

  copy (text, onWrote) {
    navigator.clipboard.writeText(text).then(onWrote)
      .catch(function (err) {
        console.error('Failed to copy: ', err)
      })
  }
}
