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

  describe('Reset 按钮', () => {
    it('渲染出 Reset 按钮', () => {
      render(<App />)
      expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()
    })

    it('点 Reset 之后计数归零', async () => {
      const user = userEvent.setup()
      render(<App />)

      const counter = screen.getByRole('button', { name: /count is/i })
      const reset = screen.getByRole('button', { name: 'Reset' })

      // 先加到 3，确认它真的变了（不然下面归零可能是假阳性）
      await user.click(counter)
      await user.click(counter)
      await user.click(counter)
      expect(counter).toHaveTextContent('Count is 3')

      await user.click(reset)
      expect(counter).toHaveTextContent('Count is 0')
    })

    it('计数本来就是 0 时，点 Reset 还是 0', async () => {
      const user = userEvent.setup()
      render(<App />)

      const counter = screen.getByRole('button', { name: /count is/i })
      await user.click(screen.getByRole('button', { name: 'Reset' }))

      expect(counter).toHaveTextContent('Count is 0')
    })

    it('Reset 之后还能继续正常计数', async () => {
      const user = userEvent.setup()
      render(<App />)

      const counter = screen.getByRole('button', { name: /count is/i })
      const reset = screen.getByRole('button', { name: 'Reset' })

      await user.click(counter)
      await user.click(reset)
      await user.click(counter)

      expect(counter).toHaveTextContent('Count is 1')
    })
  })
})
