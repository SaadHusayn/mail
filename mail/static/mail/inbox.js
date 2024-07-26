document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());

  // By default, load the inbox
  load_mailbox('inbox');

  // when submit button is pressed on compose mail
  document.querySelector('#compose-form').onsubmit = () => {

    // remove all previous error messages
    document.querySelectorAll('.text-danger').forEach(e => e.remove());

    const Recipients = document.querySelector('#compose-recipients').value;
    const Subject = document.querySelector('#compose-subject').value;
    const Body = document.querySelector('#compose-body').value;

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: Recipients,
        subject: Subject,
        body: Body
      })
    })
      .then(response => response.json())
      .then(result => {
        if (result.error !== undefined) {
          let error = document.createElement('span');
          error.classList.add("text-danger");
          error.innerHTML = result.error;
          document.querySelector('#compose-form').append(error);
        } else {
          load_mailbox('sent');
        }
      });


    return false;
  }
});

function compose_email(recipient = '', subject = '', body = '') {

  // remove all previous error messages
  document.querySelectorAll('.text-danger').forEach(e => e.remove());

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#mail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';


  document.querySelector('#compose-recipients').value = recipient;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;


}

function load_mailbox(mailbox) {

  // Getting the HTML element from DOM
  var email_view = document.querySelector('#emails-view');


  // Show the mailbox and hide other views
  email_view.style.display = 'block';
  document.querySelector('#mail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  let mailBoxName = mailbox.charAt(0).toUpperCase() + mailbox.slice(1);
  email_view.innerHTML = `<h3>${mailBoxName}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {

      if (emails.length === 0) {

        //mailbox is empty
        let message = document.createElement('h5');
        message.innerHTML = `(${mailBoxName} Mailbox is empty).`;
        email_view.append(message);

      } else {

        // ... modifying DOM ...
        let container = document.createElement('div');
        container.className = "container mails";
        email_view.append(container);
        emails.forEach(mail => {
          let row = document.createElement('div');
          if (mail.read) {
            row.className = "row border p-1 border-black mail bg-secondary";
          } else {
            row.className = "row border p-1 border-black mail bg-light";
          }

          let email = document.createElement('div');
          email.className = "col-2 text-start fw-bold";


          if (mailbox === 'sent') {

            // if user has sent email to himself, the word "me" should be displayed on the mail box
            let recipient = mail.recipients[0];
            if (mail.recipients[0] === document.querySelector('#user-email').innerHTML) {
              recipient = 'me';
            }

            if (mail.recipients.length > 1) {
              email.innerHTML = `To: ${recipient}, ...`;
            } else {
              email.innerHTML = `To: ${recipient}`;
            }
          } else {

            // if user has recieved email to himself, the word "me" should be displayed on the mail box
            let sender = mail.sender;
            if (mail.sender === document.querySelector('#user-email').innerHTML) {
              sender = 'me';
            }


            email.innerHTML = `${sender}`;
          }

          row.append(email);

          let subject = document.createElement('div');
          subject.className = "col-7";
          subject.innerHTML = mail.subject;

          row.append(subject);

          let timestamp = document.createElement('div');
          timestamp.className = "col-3 text-end";
          timestamp.innerHTML = mail.timestamp;

          row.append(timestamp);

          container.append(row);

          // when user click on an email from mailbox, information of that email should be displayed to the user 
          row.onclick = () => show_email_info(mail.id, mailbox);

        })
      }

    });
}

function show_email_info(email_id, mailbox) {

  // Show the mail-view and hide other views
  document.querySelector('#mail-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Clear out previous mail info
  document.querySelector('#mail-view').innerHTML = '';

  //now the user has read the email
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  });

  fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {


      // ... modifying DOM of #mail-view element ...
      document.querySelector('#mail-view').innerHTML = `
      <p><strong>From:</strong> ${email.sender}</p>
      <p><strong>To:</strong> ${email.recipients}</p>
      <p><strong>Subject:</strong> ${email.subject}</p>
      <p><strong>Timestamp:</strong> ${email.timestamp}</p>
      <button class="btn btn-sm btn-outline-primary" id="reply-button">Reply</button>
      <hr>
      <p><pre>${email.body}</pre></p>
    `;

      //if mailbox of this email is 'sent', then there will be no archive button
      if (mailbox !== 'sent') {
        if (email.archived) {

          let button = document.createElement('button');
          button.innerHTML = 'Remove From Archived';
          button.className = 'btn btn-sm btn-outline-primary';
          button.id = 'remove-archived';
          button.onclick = () => { remove_from_archive(email.id) };
          document.querySelector('#mail-view').append(button);

        } else {

          let button = document.createElement('button');
          button.innerHTML = 'Add To Archived';
          button.className = 'btn btn-sm btn-outline-primary';
          button.id = 'add-archived';
          button.onclick = () => { add_to_archive(email.id) };
          document.querySelector('#mail-view').append(button);

        }
      }

      document.querySelector('#reply-button').onclick = () => replyButton(email);

    });
}

function add_to_archive(emailID) {

  fetch(`/emails/${emailID}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    })
  })
    .then(() => {
      load_mailbox('inbox');
    })


}

function remove_from_archive(emailID) {

  fetch(`/emails/${emailID}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  })
    .then(() => {
      load_mailbox('inbox');
    })
}

function replyButton(email) {

  let recipient = email.sender;
  let subject = email.subject;
  let body = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;

  if (!subject.startsWith('Re: ')) {
    subject = `Re: ${subject}`;
  }

  compose_email(recipient, subject, body);
}