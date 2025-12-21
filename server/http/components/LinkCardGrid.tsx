import { css } from "@hono/hono/css"
import { PropsWithChildren } from "@hono/hono/jsx"

/**
 * CSS styles class for a responsive card grid layout.
 */
const responsiveCardGrid = css`
  display: grid;
  /* columns: auto-fit; */
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
  grid-auto-rows: 1fr;

  > .block {
    height: 100%;
    margin-bottom: 0;

    .card {
      height: 100%;
    }
  }

  .tags {
    margin-bottom: 0.5rem;
  }
`

/**
 * A responsive grid layout for displaying link cards.
 */
export function LinkCardGrid(props: PropsWithChildren) {
  return <div className={responsiveCardGrid}>{props.children}</div>
}
