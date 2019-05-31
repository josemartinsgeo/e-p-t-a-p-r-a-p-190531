define([
  "dijit/Dialog"
], function (Dialog) {
  return {
    infoMessage: function (title, content) {
      title = title || "";
      new Dialog({
          title: title.toUpperCase(),
          content: content,
          style: "width: 550px; text-align: justify;"
      }).show();
    }
  };
});
