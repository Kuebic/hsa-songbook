#!/bin/bash

# Fix unused variables by prefixing with underscore
echo "Fixing unused variables..."

# Fix middleware unused parameters
sed -i 's/\(req: Request\)/(_req: Request)/g' server/shared/middleware/errorHandler.ts
sed -i 's/\(next: NextFunction\)/(_next: NextFunction)/g' server/shared/middleware/errorHandler.ts
sed -i 's/\(res: Response\)/(_res: Response)/g' server/shared/middleware/auth.ts
sed -i 's/\(res: Response\)/(_res: Response)/g' server/shared/middleware/validation.ts

# Fix controller unused imports
sed -i 's/import { Request, Response, NextFunction }/import { Request, Response }/g' server/features/songs/song.controller.ts
sed -i 's/, optionalAuth//g' server/features/songs/song.routes.ts

# Fix model unused parameters
sed -i 's/\(doc: any\)/(_doc: any)/g' server/features/songs/song.model.ts
sed -i 's/\(doc: any\)/(_doc: any)/g' server/features/arrangements/arrangement.model.ts
sed -i 's/\(doc: any\)/(_doc: any)/g' server/features/users/user.model.ts

# Fix service unused imports
sed -i 's/, ISong//g' server/features/songs/song.service.ts
sed -i 's/, IArrangement//g' server/features/arrangements/arrangement.service.ts
sed -i 's/, IUser//g' server/features/users/user.service.ts
sed -i 's/, Types//g' server/features/users/user.types.ts
sed -i 's/, clerkClient//g' server/shared/middleware/auth.ts

# Fix unused userId parameter
sed -i 's/userId: string/_userId: string/g' server/features/arrangements/arrangement.service.ts

echo "Done!"