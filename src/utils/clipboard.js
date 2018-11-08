import copy from 'clipboard-copy'

export default function copyUrlToClipboard () {
  return copy(window.location.href)
}
