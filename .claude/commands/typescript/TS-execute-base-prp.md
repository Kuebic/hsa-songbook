# Execute BASE PRP

Implement a React/TypeScript/Vite feature using the PRP file.

## PRP File: $ARGUMENTS

## Execution Process

1. **Load PRP**
   - Read the specified PRP file
   - Understand all context and requirements
   - Follow all instructions in the PRP and extend the research if needed
   - Ensure you have all needed context to implement the PRP fully
   - Do more web searches and codebase exploration as needed

2. **ULTRATHINK**
   - Ultrathink before you execute the plan. Create a comprehensive plan addressing all requirements.
   - **Vertical Slice Validation**: Verify the PRP follows vertical slice architecture principles:
     - Feature is complete from UI to data layer within its slice
     - Minimal dependencies on other feature slices
     - Clear feature boundaries are maintained
     - Implementation doesn't violate existing slice boundaries
   - Break down the PRP into clear todos using the TodoWrite tool, prioritizing complete vertical slice implementation
   - Use agents subagents and batchtool to enhance the process.
   - **Important** YOU MUST ENSURE YOU HAVE EXTREMELY CLEAR TASKS FOR SUBAGENTS AND REFERENCE CONTEXT AND MAKE SURE EACH SUBAGENT READS THE PRP AND UNDERSTANDS ITS CONTEXT.
   - Identify implementation patterns from existing vertical slices to follow.
   - Never guess about imports, file names function names etc, ALWAYS be based in reality and real context gathering

3. ## **Execute the plan**

   ## Execute the PRP step by step
   - **Implement complete vertical slice**: Build the feature from UI to data layer within its slice
   - Follow React 19 and TypeScript best practices within the vertical slice structure
   - Ensure proper type safety with strict mode compliance
   - Use functional components with hooks following existing slice patterns
   - Follow existing React patterns and Vite conventions within feature slices
   - Implement proper error boundaries and loading states within the slice
   - **Maintain slice boundaries**: Avoid creating dependencies that violate vertical slice architecture

4. **Validate**
   - Run each validation command from the PRP
   - **Vertical Slice Architecture Compliance Check**:
     - Verify feature is self-contained within its slice directory
     - Check that cross-slice dependencies are minimal and explicit
     - Ensure no circular dependencies between slices
     - Validate that the slice follows existing slice patterns in the codebase
   - The better validation that is done, the more confident we can be that the implementation is correct.
   - Fix any failures (type errors, linting issues, test failures, architectural violations)
   - Re-run until all pass
   - Always re-read the PRP to validate and review the implementation to ensure it meets the requirements

5. **Complete**
   - Ensure all checklist items done
   - Run final validation suite
   - Report completion status
   - Read the PRP again to ensure you have implemented everything

6. **Reference the PRP**
   - You can always reference the PRP again if needed

Note: If validation fails, use error patterns in PRP to fix and retry.