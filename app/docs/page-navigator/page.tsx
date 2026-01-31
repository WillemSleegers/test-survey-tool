export default function PageNavigatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Page Navigator</h2>
        <p className="text-muted-foreground mt-1">
          A debug panel for survey authors to inspect and navigate the
          survey structure.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Overview</h3>
        <p>
          The Page Navigator is a slide-out panel accessible from the
          top-right corner of any active survey. It is designed for survey
          authors and testers; not for respondents. It provides a structural
          overview of the entire survey so the survey author can quickly
          navigate between different pages of the survey. It also contains
          tools for debugging conditional logic, which can be useful to find
          syntax errors while designing the survey.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Opening the Navigator</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>Click the menu icon in the top-right corner of the survey</li>
          <li>
            Or press <code>Cmd+/</code> (<code>Ctrl+/</code> on Windows) to
            toggle
          </li>
          <li>
            Press <code>Escape</code> to close, or click outside the panel
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Features</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            See all pages grouped by block, with a count of how many are
            visible — useful for verifying the survey structure matches your
            intended layout
          </li>
          <li>
            Hidden pages and blocks appear dimmed with their{" "}
            <code>SHOW_IF</code> conditions displayed, so you can verify
            that conditions are working correctly
          </li>
          <li>
            Click any visible page to jump directly to it, making it easy to
            test different paths through the survey
          </li>
          <li>
            View all response variables and their current values as JSON,
            helpful for debugging computed expressions
          </li>
          <li>View block-level and page-level computed variable values</li>
          <li>Return to the upload page to load a different survey</li>
        </ul>
      </div>
    </div>
  )
}
