export function QueryHints() {
  return (
    <div className="hints">
      <strong>Cheat sheet:</strong>
      <table>
        <thead>
          <tr>
            <th>Query syntax</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>static</code></td>
            <td>Free text search across all columns and rows.</td>
          </tr>
          <tr>
            <td><code>static multi</code></td>
            <td>Both words must exist in the row for it to show, space acts as AND.</td>
          </tr>
          <tr>
            <td><code>!java</code></td>
            <td>Exclude rows containing the word java.</td>
          </tr>
          <tr>
            <td><code>"Lisp, ML"</code></td>
            <td>Match phrase. Without quotation marks space acts as and across the entire row.</td>
          </tr>
          <tr>
            <td><code>[1985:1995]</code></td>
            <td>Match numeric range.</td>
          </tr>
          <tr>
            <td><code>@start:ml</code></td>
            <td>Column start with word</td>
          </tr>
          <tr>
            <td><code>lisp:@end</code></td>
            <td>Column ends with word</td>
          </tr>
        </tbody>
      </table>

      <p>Try combining different syntax, for example: <code>!@start:"Lisp, ML"</code></p>
    </div>
  )
}
