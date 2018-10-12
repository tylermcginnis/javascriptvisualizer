import copy from 'copy-text-to-clipboard'

export default function copyUrlToClipboard () {
  return copy(window.location.href)
}
