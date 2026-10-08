import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('渲染出标题', () => {
    render(<App />)
    // getByRole 按「用户看到的东西」来查，比查 class name 更接近真实使用
    expect(screen.getByRole('heading', { name: 'Get started' })).toBeInTheDocument()
  })

  it('计数器初始值是 0', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /count is 0/i })).toBeInTheDocument()
  })

  it('点一下按钮，计数加一', async () => {
    const user = userEvent.setup()
    render(<App />)

    const button = screen.getByRole('button', { name: /count is/i })
    await user.click(button)

    expect(button).toHaveTextContent('Count is 1')
  })

  it('点三下，计数变成 3', async () => {
    const user = userEvent.setup()
    render(<App />)

    const button = screen.getByRole('button', { name: /count is/i })
    await user.click(button)
    await user.click(button)
    await user.click(button)

    expect(button).toHaveTextContent('Count is 3')
  })
})
