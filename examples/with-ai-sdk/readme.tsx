/*

    Idea.
    Define your tools within a toolbox, the toolbox by default gets put into the client side.
     You export the toolbox type from the server to the client. Since client side tool invocations
     happen because .execute on tools ( at least for AI SDK ) don't exist, then when you define a tool
     in the initial toolbox code on the server, you follow the exisitng pattern of not putting the .execute there.

     The .execute for client side tools can be either in the useToolBox / clientToolBox which lives on the client side
     or it can just be in the place where you'd like to handle the tool itself ( makeAssitantUITool ). Everything for this
     will be pretty typesafe. A nice to have will be that if you make an assitantUI tool and the .execute is missing,
     from some part of this chain then you will get a type error in the place where you make the tool UI.

     Also if you do .execute on the clientToolbox and in the make UI then you should get an error. 

     You should be making everything from the toolbox. clientToolBox.tool.makeToolUI

     toolbox({
    //  clientTools:
    // serverTools:
     })

     implementation wise we should accept tools from the sdk's they are defined with. Then we should build a "type bridge", 
     something in our types that says that the external types match this pattern of our internal types. Then go from there.
     We might have no-op functions that transform an external type into an internal one.

     we will have a no-op function that returns the tools on the server side in the type of the tools defined in the serverTools
     section. If a user defines a tool in a way that's no good then reject it.

     This means that we will need to support vercel's multiple ways of defining tools outside of zod.

     Support langgraph in a different release / different PR.

     Follow the existing patterns for where tools and types live. ( tsx vs ts files and the "use client" vs "use server")
     directives.

     use the satisfies keyword to avoid having to create a function that returns tools out.

     Assume that tools without .execute on them are handled in the client side.

     The actual typesafe layer is just ensuring that .render gets good types and that you aren't missing a .execute w client side etools
     also the fact that .execute works on the client side is super nice.
*/
