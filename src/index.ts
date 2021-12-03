import "./style.css"
import {readwiseGetBookList, readwiseGetHighlightsByBookID} from "./readwiseStuff";

let btnRefreshHighlightList: HTMLButtonElement;
let inputReadwiseApiToken: HTMLInputElement;
let bookListDiv: HTMLDivElement;
let buttonConfigureReadwise: HTMLImageElement;
let divSettingsWrapper: HTMLDivElement;

window.addEventListener("load", async () => {
  btnRefreshHighlightList = <HTMLButtonElement> document.getElementById('btn-execute');
  inputReadwiseApiToken = <HTMLInputElement> document.getElementById("readwise-api-key")
  bookListDiv = <HTMLDivElement> document.getElementById("book-list");
  buttonConfigureReadwise = <HTMLImageElement> document.getElementById("btn-configure-readwise");
  divSettingsWrapper = <HTMLDivElement> document.getElementById("config-readwise-setings");

  // prepare event handlers
  btnRefreshHighlightList?.addEventListener("click", async () => {
      bookListDiv.innerHTML="";
      await listBooks()
  });

  inputReadwiseApiToken?.addEventListener("keyup", () => {
      craft.storageApi.put("readwiseToken", inputReadwiseApiToken.value)
      if(inputReadwiseApiToken.value.trim()==="") {
        btnRefreshHighlightList.style.display="";
        divSettingsWrapper.style.display="inline";
      }
  });

  buttonConfigureReadwise?.addEventListener("click", async () => {
    divSettingsWrapper.style.display = divSettingsWrapper.style.display==="" ? "inline" : "";
    bookListDiv.innerHTML = "";
    bookListDiv.style.height="0px";
    btnRefreshHighlightList.style.visibility="hidden";
    if(inputReadwiseApiToken.value.trim()!="") btnRefreshHighlightList.style.display="inline";
    if(divSettingsWrapper.style.display==="") {
      bookListDiv.innerHTML = "";
      bookListDiv.style.height="450px";
      btnRefreshHighlightList.style.visibility="visible";
    }
  });

  // initialize UI
  const rwToken = await craft.storageApi.get("readwiseToken");
  if (rwToken.status != "error" && rwToken.data != "") {
      inputReadwiseApiToken.value = rwToken.data;
      btnRefreshHighlightList.style.display = "inline";
      await listBooks();
  } else {
    divSettingsWrapper.style.display = "inline";
    bookListDiv.style.height="0px";
  }

})

const insertHighlights = async (id : string) => {
  const rwToken = await craft.storageApi.get("readwiseToken");
  const highlights =  await readwiseGetHighlightsByBookID(<string> rwToken.data, id);

  craft.dataApi.addBlocks( [ craft.blockFactory.horizontalLineBlock({lineStyle:"light"}) ]);
  const bulletStyle = craft.blockFactory.defaultListStyle("bullet");
  const allHighlights = highlights.results.map( (h:any) => {
    return craft.blockFactory.textBlock({
      listStyle: bulletStyle,
      content: [
        { text: h.text + " " },
        { text: "link", link: { type: "url", url: `https://readwise.io/open/${h.id}` } }
      ]
    });
  });
  craft.dataApi.addBlocks(allHighlights);
  craft.dataApi.addBlocks( [ craft.blockFactory.horizontalLineBlock({lineStyle:"light"}) ]);
}

const listBooks = async () => {
  const rwToken = await craft.storageApi.get("readwiseToken");
  const bookList = await readwiseGetBookList(<string>rwToken.data)
  let output = "";
  if(bookList===null) {
    bookListDiv.innerHTML="Information could not be retrieved from Readwise. Please verify the Readwise Access Token."
    return;
  }
  bookList.forEach((e : any) => {
    if(e.num_highlights===0) return;
    output += `<div class="ReadWiseBook"  style="padding-bottom:4px; width=250px; display: flex; border-top-style:dashed; border-top-width:1px; padding-top:5px">
            <span style="width:50px;padding-left:5px;"><img src="${e.cover_image_url}" width="45px"></span>
              <span style="width:170px;padding-left:5px"">
                <div >${e.title} (${e.num_highlights})</div>
                <div>${e.author}</div>
              </span>
              <span><img class="btn-insert-highlights" id="${e.id}" src="https://readwise-assets.s3.amazonaws.com/static/images/new_icons/import.30df72e7b737.svg"></span>                 
            </div>`;
  });
  bookListDiv.innerHTML = output;
  document.querySelectorAll(".btn-insert-highlights").forEach(async (i) => {
      i.addEventListener("click", async (e) => await insertHighlights(i.id) );
  });
}

craft.env.setListener((env) => {
    switch (env.colorScheme) {
        case "dark":
            document.body.classList.add("dark");
            break;
        case "light":
            document.body.classList.remove("dark");
            break;
    }
})