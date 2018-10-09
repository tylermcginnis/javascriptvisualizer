import React from 'react'
import styled from 'styled-components'
import { FaTwitter, FaFacebook, FaLinkedin } from 'react-icons/fa';

const SocialRow = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin: 25px 0 0 0;
`

const Social = styled.a`
  border: none;
  width: 50px;
  min-width: 50px;
  height: 50px;
  border-radius: 25px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 5px;
  background: ${({ background }) => background};

  &:hover {
    background: ${({ hoverBg }) => hoverBg};
  }
`

const title = `JavaScript Visualizer: A tool for visualizing Execution Context, Hoisting, Closures, and Scopes in JavaScript by @tylermcginnis`
const link = 'https://javascriptvisualizer.com'

const twitterUrl = `https://twitter.com/share?url=${encodeURIComponent(link)}&text=${title}`
const facebookUrl = `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`
const linkedinUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${link}&title=${title}`

export default function SocialBadges ({ fill='#fff', background='#000' }) {
  return (
    <SocialRow>
      <Social target="_blank" href={twitterUrl} background={background} hoverBg='#25a8e0'>
        <FaTwitter color={fill} size={22} />
      </Social>
      <Social target="_blank" href={facebookUrl} background={background} hoverBg='#3b5a99'>
        <FaFacebook color={fill} size={22} />
      </Social>
      <Social target="_blank" href={linkedinUrl} background={background} hoverBg='#0d7bb7'>
        <FaLinkedin color={fill} size={22} />
      </Social>
    </SocialRow>
  )
}