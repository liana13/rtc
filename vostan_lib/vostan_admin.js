/*
 * Vostan CMS
 * Copyright (c) 2005-2015 Instigate CJSC
 * E-mail: info@instigatedesign.com
 * 58/1 Karapet Ulnetsi St.,
 * Yerevan, 0069, Armenia
 * Tel:  +1-408-625-7509
 * +49-893-8157-1771
 * +374-60-464700
 * +374-10-248411

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function() {

    /* End Nodes collection object */
    $(document).on("touchstart mousedown", function(event) {
        var _event = event;
        if (event.which == 3 || vostan.getTouchTimer()) {
            event.preventDefault();
            return;
        }
        var timer;
        var array = $(".view").find('*');
        if (($.inArray(event.target, array) !== -1) || (event.target.className == "view")) {
            return;
        }
        if (event.target.tagName == "CANVAS") {
            event.preventDefault();
            timer = setTimeout(function() {
                vostan.toggleMode();
                $(this).unbind("touchstart mousedown ");
            }, 1000);
        }
        $(this).on("touchend mouseup", function() {
            clearTimeout(timer);
        });
    });

    var charKeyEsc = 27;
    var charKeyI = 73;

    $(document).keydown(function(e) {
        if (e.which == charKeyEsc && vostan.isEditMode() && !window.cmActive) {
            if($("#vostanEditStage")[0]) {
                $("#vostanEditStage").html("");
            }
            if($("#editControls")[0]) {
                $("#editControls").hide();
            }
            if(window.sOverlay) {
                window.sOverlay.remove();
            }
            vostan.toggleMode();
        }
    });

    var config = {
        host : "api.php",
        root : 1,
        animationDelayMin : 0,
        animationDelayMax : 300,
        share: true,
        toggle: true,
        export: true,
        export_full: true,
        locales : {
            en: 'eng',
            hy: 'հայ'
        },
        defaultLang : "en",
        msg : {
            btn : {
                edit : "Edit",
                link : "Connect",
                script : "Script",
                hide_in_all : "Hide from all layouts",
                show_in_all : "Show in all layouts",
                apply_settings : "Apply this geometry everywhere",
                expand : "Show all neighbors",
                collapse : "Hide all neighbors",
                add : "Add",
                hide : "Hide from this layout",
                dlt : "Delete",
                copy_settings : "Copy geometry",
                paste_settings : "Paste geometry",
                copy_node: "Copy appearance",
                paste_node: "Paste appearance",
                edit_txt: 'Description',
                edit_img: 'Icon',
                edit_tags: 'Tags',
                edit_viewers: 'Users allowed to view',
                edit_editor: 'Users allowed to edit',
                edit_location: 'External URL',
                edit_title: 'Title',
                incl_image : "Display the icon",
                incl_title : "Display the title",
                incl_txt : "Display the description",
                non_exp : "Non-Expandable",
                exp : "Expandable",
                select: "Select",
                upload_from_url: "Upload from URL",
                choose_file: "Choose file",
                cancel: "Cancel",
                users_edit: "Users allowed to Edit",
                users_view: "Users allowed to View",
                tags: "Tags",
                location: "External URL",
                query : "New Query",
                start_capturing : "Start Capturing",
                cancel_capturing : "Cancel Capturing",
                export_all : "Export All",
                cancel_export_all : "Cancel Export",
                export_html : "html",
                export_vop : "vop",
                save : "Save",
                search : "Search",
                attachmenttag : "attachment",
                nodescount: "Total: "
            },
            alert : {
                export_failed : "Export failed.",
                expand_conflict : "There are conflicting Nodes.",
                no_upload : "No uploads found.",
                query_link : "Please link the Query to any node for the filtering.",
                session: "Your Session is Expired. Please Login.",
                permission: "You Don't have permissions to Edit this View.",
                duplicatename: "Duplicate Name: A file with the same name already exists on the server.",
                copy_node: "Please copy the node you want to paste.",
                hide_node : "Do you want to hide the Node?",
                dlt_node : "Do you want to delete the Node?",
                expand_node : "Do you want to expand the Node?",
                collapse_node : "Do you want to collapse the Node?",
                hide_unsaved_node: "Changes to the node will be lost. Click OK to proceed.",
                show_in_all : "Do you want to show the node in all Layouts?",
                hide_in_all : "Do you want to hide the node from all Layouts?",
                apply_settings : "Do you want to apply the current node's settings in all layouts?",
                change_position : "Do you want to change the Node's position as well?",
                dlt_link : "Do you want to delete the link?"
            }
        },
        msg_hy : {
            btn : {
                edit : "Խմբագրել",
                link : "Կապել",
                script : "Սկրիպտ",
                hide_in_all : "Թաքցնել բոլոր դասավորություններից",
                show_in_all : "Ավելացնել բոլոր դասավորություններում",
                apply_settings : "Կիրառել տեսքը բոլոր դասավորություններում",
                expand : "Ցուցադրել բոլոր հարևաններին",
                collapse : "Թաքցնել բոլոր հարևաններին",
                add : "Ավելացնել",
                hide : "Թաքցնել",
                dlt : "Ջնջել",
                copy_settings : "Պատճենել տեսքը",
                paste_settings : "Կիրառել տեսքը",
                copy_node: "Պատճենել երևույթը",
                paste_node: "Կիրառել երևույթը",
                edit_txt: 'Տեքստ',
                edit_img: 'Նկար',
                edit_tags: 'Պիտակներ',
                edit_viewers: 'Viewers',
                edit_editor: 'Editor',
                edit_location: 'Արտաքին հղում',
                edit_title: 'Անուն',
                incl_image : "Ցուցադրել նկարը",
                incl_title : "Ցուցադրել անունը",
                incl_txt : "Ցուցադրել տեքստը",
                non_exp : "Չբացվող",
                exp : "Բացվող",
                upload_from_url: "Բեռնել հղումից",
                choose_file: "Բեռնել նիշք",
                select: "Ընտրել",
                cancel: "Չեղարկել",
                users_edit: "Օգտագործողներ, որենք կարեղ են փոփոխել",
                users_view: "Օգտագործողներ, որոնք կարող են տեսնել",
                tags: "Պիտակներ",
                location: "Արտաքին հղում",
                query : "Նոր հարցում",
                start_capturing : "Սկսել արտածումը",
                cancel_capturing : "Չեղարկել արտածումը",
                export_all : "Արտածել ամբողջը",
                cancel_export_all : "Չեղարկել արտածումը",
                export_html : "html",
                export_vop : "vop",
                save : "Պահպանել",
                search : "Որոնում",
                attachmenttag : "կցորդ",
                nodescount: "Ընդամենը՝ "
            },
            alert : {
                export_failed : "Սխալ արտածում։",
                expand_conflict : "Որոշ կրկնություններ անտեսվել են։",
                no_upload : "Վերբեռնումներ չկան։",
                query_link : "Միացրեք հարցումը որևէ գագաթի։",
                session: "Սերվերի հետ կապն ընդհատված է։ Նորից մուտք գործեք։",
                permission: "Դուք չեք կարող խմբագրել։",
                duplicatename: "Նման անունով նիշք գոյություն ունի։",
                copy_node: "Կրկնօրինակեք այն գագաթը, որը ցանկանում եք տեղադրել։",
                hide_node : "Թաքցնե՞լ գագաթը:",
                dlt_node : "Ջնջե՞լ գագաթը:",
                expand_node : "Բացե՞լ գագաթը:",
                collapse_node : "Փակե՞լ գագաթը:",
                hide_unsaved_node: "Չպահպանված գագաթը կկորի։ Սեղմեք OK հաստատելու համար։",
                show_in_all : "Ավելացնե՞լ գագաթն ամենուր:",
                hide_in_all : "Թաքցնե՞լ գագաթն ամենուր:",
                apply_settings : "Պատճենե՞լ գագաթի տեսքն ամենուր:",
                change_position : "Փոխե՞լ գագաթի դիրքը:",
                dlt_link : "Ջնջե՞լ կապը:"
            }
        }
    };

    var getUserNode = function() {
        $.ajax({
            type : 'GET',
            url : config.host + '/check/root',
            dataType : 'json',
            success : function(data) {
            },
            error : function(xhr) {
                console.log("Error in /check/root/", xhr);
            },
            complete : function() {
                window.vostan = new window.Vostan(config);
            }
        });
    };
    getUserNode();

})(); 
