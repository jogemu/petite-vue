import { Block } from '../block'
import { evaluate } from '../eval'
import { checkAttr } from '../utils'
import { Context } from '../context'

interface Branch {
  exp?: string | null
  el: Element
}

export const _if = (el: Element, exp: string, ctx: Context) => {
  if (import.meta.env.DEV && !exp.trim()) {
    console.warn(`v-if expression cannot be empty.`)
  }
  const parent = el.parentNode!
  const anchor = new Text('')
  const comment = new Comment('v-if')
  parent.insertBefore(anchor, el)
  parent.insertBefore(comment, anchor)
  const branches: Branch[] = [
    {
      exp,
      el
    }
  ]

  // locate else branch
  let elseEl: Element | null
  let elseExp: string | null
  while ((elseEl = el.nextElementSibling)) {
    elseExp = null
    if (
      checkAttr(elseEl, 'v-else') === '' ||
      (elseExp = checkAttr(elseEl, 'v-else-if'))
    ) {
      parent.removeChild(elseEl)
      branches.push({ exp: elseExp, el: elseEl })
    } else {
      break
    }
  }

  const nextNode = el.nextSibling
  parent.removeChild(el)

  let block: Block | undefined
  let activeBranchIndex: number = -1

  const removeActiveBlock = () => {
    if (block) {
      anchor.parentNode!.insertBefore(comment, block.el)
      block.remove()
      block = undefined
    }
  }

  ctx.effect(() => {
    for (let i = 0; i < branches.length; i++) {
      const { exp, el } = branches[i]
      if (!exp || evaluate(ctx.scope, exp)) {
        if (i !== activeBranchIndex) {
          removeActiveBlock()
          block = new Block(el, ctx)
          const parent = anchor.parentNode! as Element;
          block.insert(parent, anchor)
          parent.removeChild(comment)
          activeBranchIndex = i
        }
        return
      }
    }
    // no matched branch.
    activeBranchIndex = -1
    removeActiveBlock()
  })

  return nextNode
}