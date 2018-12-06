import { ASTKindChecker, ASTNode, ASTUtil, Block, Visitor } from "@ballerina/ast-model";

let actionView = false;

function isOrdinaryStatement(node: ASTNode): boolean {
    return !ASTKindChecker.isIf(node)
     && !ASTKindChecker.isMatch(node)
     && !ASTKindChecker.isReturn(node)
     && !ASTKindChecker.isWhile(node)
     && !ASTUtil.isActionInvocation(node);
    return true;
}

export const visitor: Visitor = {

    beginVisitBlock(node: Block) {
        node.statements.forEach((element) => {
            if (isOrdinaryStatement(element)) {
                if (element.viewState) {
                    element.viewState.hidden = actionView;
                }
            }
        });

    }

};

export function setActionViewStatus(enabled = false) {
    actionView = enabled;
}
